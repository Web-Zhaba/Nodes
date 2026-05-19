import { useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getImpulsesForDateBatch,
  updateQuantityValue
} from "../nodeService";
import { recordImpulse } from "@/lib/api/stability";
import { format } from "date-fns";
import { useSyncStore } from "@/store/useSyncStore";
import { Network } from "@capacitor/network";
import { toast } from "sonner";

export const impulseKeys = {
  all: ["impulses"] as const,
  date: (date: Date) => [...impulseKeys.all, format(date, "yyyy-MM-dd")] as const,
};

export function useImpulsesQuery(nodeIds: string[], date: Date, userId: string | undefined) {
  return useQuery({
    queryKey: impulseKeys.date(date),
    queryFn: () => getImpulsesForDateBatch(nodeIds, date),
    enabled: !!userId && nodeIds.length > 0,
    staleTime: 60 * 1000, // Данные считаются свежими 1 минуту, не дергаем API зря
  });
}

export function useRecordPulseMutation() {
  const queryClient = useQueryClient();
  const activeMutationsRef = useRef<Set<string>>(new Set());

  return useMutation({
    onMutate: async ({ nodeId, value, date }: { nodeId: string; value: number; date: Date }) => {
      const dateStr = format(date, "yyyy-MM-dd");
      const impulseKey = impulseKeys.date(date);
      
      // Отменяем исходящие запросы, чтобы они не перезаписали наш оптимизм
      await Promise.all([
        queryClient.cancelQueries({ queryKey: impulseKey }),
        queryClient.cancelQueries({ queryKey: ["nodes"] }),
        queryClient.cancelQueries({ queryKey: ["cores"] }),
      ]);

      const previousImpulses = queryClient.getQueryData<any[]>(impulseKey);
      const previousNodes = queryClient.getQueryData<Record<string, any>>(["nodes"]);

      // 1. Оптимистично обновляем только состояние импульса (галочку/значение)
      // Полоску стабильности НЕ трогаем, ждем точный ответ от сервера (он придет через <100мс)
      queryClient.setQueryData(impulseKey, (old: any[] = []) => {
        const isDelete = value < 0 || value === 0;
        if (isDelete) return old.filter(imp => imp.node_id !== nodeId);
        const existing = old.find(imp => imp.node_id === nodeId);
        if (existing) return old.map(imp => imp.node_id === nodeId ? { ...imp, value } : imp);
        return [...old, { node_id: nodeId, value, completed_at: dateStr }];
      });

      return { previousImpulses, previousNodes, impulseKey };
    },
    mutationFn: async ({ nodeId, value, date }: { nodeId: string; value: number; date: Date }) => {
      // Защита от двойных кликов: если мутация для этого узла уже идет, скипаем
      if (activeMutationsRef.current.has(nodeId)) {
        console.warn(`[DEDUPE] Mutation for ${nodeId} already in progress, skipping`);
        return { success: true, skipped: true };
      }

      activeMutationsRef.current.add(nodeId);
      try {
        const dateStr = format(date, "yyyy-MM-dd");

        let online = navigator.onLine;
        try {
          const status = await Network.getStatus();
          online = status.connected;
        } catch {}

        if (!online) {
          // Enqueue task in sync store
          useSyncStore.getState().enqueueTask({
            type: "pulse",
            nodeId,
            value,
            dateStr,
          });
          return { success: true, offline: true };
        }

        return await recordImpulse(nodeId, value, dateStr);
      } finally {
        activeMutationsRef.current.delete(nodeId);
      }
    },
    onSuccess: (res, variables) => {
      // Проверяем тип результата
      if (res && "skipped" in res) return

      if (res && "offline" in res && res.offline) {
        toast.info("Сохранено офлайн", {
          description: "Действие будет синхронизировано при подключении к сети.",
          id: `offline-pulse-${variables.nodeId}`,
        })
        return
      }

      // После ранних выходов res гарантированно является результатом от сервера
      const serverRes = res as {
        success: boolean
        new_stability_score?: number
        new_completion_count?: number
      }

      if (serverRes && serverRes.success && serverRes.new_stability_score !== undefined) {
        // Вместо инвалидации (нового запроса) — просто вписываем точное число от сервера
        queryClient.setQueryData(["nodes"], (old: Record<string, any> = {}) => {
          const node = old[variables.nodeId]
          if (!node) return old
          return {
            ...old,
            [variables.nodeId]: { 
              ...node, 
              stability_score: serverRes.new_stability_score,
              completion_count: serverRes.new_completion_count ?? node.completion_count
            }
          }
        })
        // Тихая инвалидация ядер, так как их сложнее рассчитать точно на фронте
        queryClient.invalidateQueries({ queryKey: ["cores"] })
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
    onMutate: async ({ nodeId, value, date }: { nodeId: string; value: number; date: Date }) => {
      const dateStr = format(date, "yyyy-MM-dd");
      const impulseKey = impulseKeys.date(date);

      await queryClient.cancelQueries({ queryKey: impulseKey });

      const previousImpulses = queryClient.getQueryData<any[]>(impulseKey);

      // Оптимистично обновляем значение в кэше импульсов
      queryClient.setQueryData(impulseKey, (old: any[] = []) => {
        const existing = old.find((imp) => imp.node_id === nodeId);
        if (existing) return old.map((imp) => (imp.node_id === nodeId ? { ...imp, value } : imp));
        return [...old, { node_id: nodeId, value, completed_at: dateStr }];
      });

      return { previousImpulses, impulseKey };
    },
    mutationFn: async ({ nodeId, value, date }: { nodeId: string; value: number; date: Date }) => {
      const dateStr = format(date, "yyyy-MM-dd");

      let online = navigator.onLine;
      try {
        const status = await Network.getStatus();
        online = status.connected;
      } catch {}

      if (!online) {
        // Enqueue task in sync store
        useSyncStore.getState().enqueueTask({
          type: "quantity",
          nodeId,
          value,
          dateStr,
        });
        return { success: true, offline: true };
      }

      const success = await updateQuantityValue(nodeId, value, date);
      if (!success) throw new Error("Supabase update failed");
      return { success: true };
    },
    onSuccess: (res, variables) => {
      if (res && "offline" in res && res.offline) {
        toast.info("Сохранено офлайн", {
          description: "Значение будет синхронизировано при подключении к сети.",
          id: `offline-qty-${variables.nodeId}`,
        });
      } else {
        queryClient.invalidateQueries({ queryKey: impulseKeys.date(variables.date) });
      }
    },
    onError: (_err, _variables, context: any) => {
      if (context?.previousImpulses) {
        queryClient.setQueryData(context.impulseKey, context.previousImpulses);
      }
    },
  });
}
