import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getImpulsesForDateBatch, 
  createImpulse, 
  deleteImpulse,
  updateQuantityValue
} from "../nodeService";
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
  });
}

export function useCreateImpulseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ nodeId, value, date }: { nodeId: string; value: number; date: Date }) =>
      createImpulse(nodeId, value, date),
    onSuccess: (_, { date }) => {
      queryClient.invalidateQueries({ queryKey: impulseKeys.date(date) });
      // Also invalidate nodes because completion_count might have changed (if we use it)
      queryClient.invalidateQueries({ queryKey: ["nodes"] });
    },
  });
}

export function useDeleteImpulseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ nodeId, date }: { nodeId: string; date: Date }) =>
      deleteImpulse(nodeId, date),
    onSuccess: (_, { date }) => {
      queryClient.invalidateQueries({ queryKey: impulseKeys.date(date) });
      queryClient.invalidateQueries({ queryKey: ["nodes"] });
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
