import { useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getImpulsesForDateBatch,
  updateQuantityValue,
  createImpulse
} from "../nodeService";
import { useLocalDatabase } from "@/store/useLocalDatabase";
import { format } from "date-fns";

export const impulseKeys = {
  all: ["impulses"] as const,
  date: (date: Date) => [...impulseKeys.all, format(date, "yyyy-MM-dd")] as const,
};

export function useImpulsesQuery(nodeIds: string[], date: Date, userId: string | undefined) {
  return useQuery({
    queryKey: impulseKeys.date(date),
    queryFn: () => getImpulsesForDateBatch(nodeIds, date),
    enabled: !!userId && nodeIds.length > 0,
    staleTime: 60 * 1000,
  });
}

export function useRecordPulseMutation() {
  const queryClient = useQueryClient();
  const activeMutationsRef = useRef<Set<string>>(new Set());

  return useMutation({
    onMutate: async ({ nodeId, value, date }: { nodeId: string; value: number; date: Date }) => {
      const dateStr = format(date, "yyyy-MM-dd");
      const impulseKey = impulseKeys.date(date);

      // Отменяем исходящие запросы
      await Promise.all([
        queryClient.cancelQueries({ queryKey: impulseKey }),
        queryClient.cancelQueries({ queryKey: ["nodes"] }),
        queryClient.cancelQueries({ queryKey: ["cores"] }),
      ]);

      const previousImpulses = queryClient.getQueryData<any[]>(impulseKey);
      const previousNodes = queryClient.getQueryData<Record<string, any>>(["nodes"]);

      queryClient.setQueryData(impulseKey, (old: any[] = []) => {
        const existing = old.find(imp => imp.node_id === nodeId);
        const isDelete = value < 0 || (value === 0 && (!existing || !existing.comment || existing.comment.trim() === ""));
        
        if (isDelete) {
          return old.filter(imp => imp.node_id !== nodeId);
        }
        
        if (existing) {
          return old.map(imp => imp.node_id === nodeId ? { ...imp, value } : imp);
        }
        
        return [...old, { node_id: nodeId, value, completed_at: dateStr }];
      });

      return { previousImpulses, previousNodes, impulseKey };
    },
    mutationFn: async ({ nodeId, value, date }: { nodeId: string; value: number; date: Date }) => {
      if (activeMutationsRef.current.has(nodeId)) {
        console.warn(`[DEDUPE] Mutation for ${nodeId} already in progress, skipping`);
        return { success: true, skipped: true };
      }

      activeMutationsRef.current.add(nodeId);
      try {
        const success = await createImpulse(nodeId, value, date);
        if (!success) {
          return { success: false, error: "Failed to record impulse" };
        }
        const node = useLocalDatabase.getState().nodes.find((n) => n.id === nodeId);
        return {
          success: true,
          new_stability_score: node?.stability_score ?? 0,
          new_completion_count: node?.completion_count ?? 0,
        };
      } finally {
        activeMutationsRef.current.delete(nodeId);
      }
    },
    onSuccess: (res, variables) => {
      if (res && !('skipped' in res) && res.success && res.new_stability_score !== undefined) {
        queryClient.setQueryData(["nodes"], (old: Record<string, any> = {}) => {
          const node = old[variables.nodeId];
          if (!node) return old;
          return {
            ...old,
            [variables.nodeId]: {
              ...node,
              stability_score: res.new_stability_score,
              completion_count: res.new_completion_count ?? node.completion_count
            }
          };
        });
        queryClient.invalidateQueries({ queryKey: ["cores"] });
      }
    },
    onError: (_err, _variables, context: any) => {
      if (context?.previousImpulses) queryClient.setQueryData(context.impulseKey, context.previousImpulses);
      if (context?.previousNodes) queryClient.setQueryData(["nodes"], context.previousNodes);
    },
  });
}

export function useUpdateQuantityMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ nodeId, value, date }: { nodeId: string; value: number; date: Date }) =>
      updateQuantityValue(nodeId, value, date),
    onSuccess: (_, { date }) => {
      queryClient.invalidateQueries({ queryKey: impulseKeys.date(date) });
    },
  });
}
