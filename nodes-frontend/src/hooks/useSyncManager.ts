import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Network } from "@capacitor/network";
import { useSyncStore } from "@/store/useSyncStore";

export function useSyncManager() {
  const queryClient = useQueryClient();
  const processQueue = useSyncStore((state) => state.processQueue);
  const queue = useSyncStore((state) => state.queue);
  const isSyncing = useSyncStore((state) => state.isSyncing);
  const isFirstMountRef = useRef(true);

  useEffect(() => {
    // 1. Синхронизируем при старте приложения, если есть подключение и задачи в очереди
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      Network.getStatus().then((status) => {
        if (status.connected && queue.length > 0 && !isSyncing) {
          console.log("[SyncManager] Startup check: online. Processing queue...");
          processQueue(queryClient);
        }
      });
    }

    // 2. Слушаем переходы из оффлайна в онлайн
    let removeListener: (() => void) | null = null;

    Network.addListener("networkStatusChange", (status) => {
      if (status.connected && queue.length > 0 && !isSyncing) {
        console.log("[SyncManager] Network online transition. Processing queue...");
        processQueue(queryClient);
      }
    }).then((listener) => {
      removeListener = () => listener.remove();
    });

    // 3. Фоновый опрос для надежности (каждые 30 секунд)
    const interval = setInterval(() => {
      Network.getStatus().then((status) => {
        if (status.connected && queue.length > 0 && !isSyncing) {
          console.log("[SyncManager] Background periodic check. Processing queue...");
          processQueue(queryClient);
        }
      });
    }, 30000);

    return () => {
      if (removeListener) removeListener();
      clearInterval(interval);
    };
  }, [queryClient, processQueue, queue.length, isSyncing]);
}
export default useSyncManager;
