import { create } from "zustand";
import { persist } from "zustand/middleware";
import { recordImpulse } from "@/lib/api/stability";
import { updateQuantityValue } from "@/features/nodes/nodeService";
import { parseISO } from "date-fns";
import { toast } from "sonner";
import type { QueryClient } from "@tanstack/react-query";

export interface SyncTask {
  id: string;
  type: "pulse" | "quantity";
  nodeId: string;
  value: number;
  dateStr: string;
  createdAt: number;
}

interface SyncState {
  queue: SyncTask[];
  isSyncing: boolean;
  enqueueTask: (task: Omit<SyncTask, "id" | "createdAt">) => void;
  processQueue: (queryClient: QueryClient) => Promise<void>;
  clearQueue: () => void;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      queue: [],
      isSyncing: false,

      enqueueTask: (taskData) => {
        const newTask: SyncTask = {
          ...taskData,
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          createdAt: Date.now(),
        };

        set((state) => {
          // Исключаем дубликаты одинаковых действий для того же узла на ту же дату
          // Оставляем только самое последнее действие, чтобы не слать лишние запросы бэкенду
          const filteredQueue = state.queue.filter(
            (t) => !(t.nodeId === taskData.nodeId && t.dateStr === taskData.dateStr)
          );
          return { queue: [...filteredQueue, newTask] };
        });
      },

      processQueue: async (queryClient: QueryClient) => {
        const { queue, isSyncing } = get();
        if (isSyncing || queue.length === 0) return;

        // Проверяем наличие интернет-соединения
        if (!navigator.onLine) {
          console.warn("[SyncEngine] Offline, skipping sync queue processing");
          return;
        }

        set({ isSyncing: true });
        
        let successCount = 0;
        let hasRetryableError = false;
        
        const originalQueue = [...queue];
        const processedIds: string[] = [];

        toast.loading("Синхронизация офлайн-действий...", { id: "sync-toast" });

        for (const task of originalQueue) {
          try {
            let success = false;
            let errorMsg = "";

            if (task.type === "pulse") {
              const res = await recordImpulse(task.nodeId, task.value, task.dateStr);
              success = res.success;
              errorMsg = res.error || "Unknown Django API error";
            } else if (task.type === "quantity") {
              // Преобразуем строку даты обратно в объект Date
              const dateObj = parseISO(task.dateStr);
              success = await updateQuantityValue(task.nodeId, task.value, dateObj);
              errorMsg = "Supabase update failed";
            }

            if (success) {
              successCount++;
              processedIds.push(task.id);
              // Обновляем очередь в реальном времени, удаляя выполненную задачу
              set((state) => ({
                queue: state.queue.filter((t) => t.id !== task.id),
              }));
            } else {
              console.error(`[SyncEngine] Task ${task.id} failed: ${errorMsg}`);
              // Если ошибка авторизации или 4xx (похоже на bad request), удаляем задачу, чтобы не блокировать очередь
              if (errorMsg.includes("No auth") || errorMsg.includes("400") || errorMsg.includes("403")) {
                processedIds.push(task.id);
                set((state) => ({
                  queue: state.queue.filter((t) => t.id !== task.id),
                }));
              } else {
                // Временная ошибка сети или бэкенда (5xx, таймаут) -> останавливаем синхронизацию до следующего раза
                hasRetryableError = true;
                break;
              }
            }
          } catch (err) {
            console.error(`[SyncEngine] Exception processing task ${task.id}:`, err);
            hasRetryableError = true;
            break;
          }
        }

        set({ isSyncing: false });

        if (successCount > 0) {
          toast.success(`Синхронизировано действий: ${successCount}`, { id: "sync-toast" });
          
          // Инвалидируем кэш React Query, чтобы обновить UI актуальными серверными данными
          queryClient.invalidateQueries({ queryKey: ["impulses"] });
          queryClient.invalidateQueries({ queryKey: ["nodes"] });
          queryClient.invalidateQueries({ queryKey: ["cores"] });
        } else {
          // Закрываем лоадер-тост
          toast.dismiss("sync-toast");
        }

        if (hasRetryableError) {
          toast.error("Некоторые действия будут синхронизированы позже", {
            description: "Проблема с подключением к серверу.",
          });
        }
      },

      clearQueue: () => {
        set({ queue: [] });
      },
    }),
    {
      name: "nodes-sync-queue-storage",
    }
  )
);
