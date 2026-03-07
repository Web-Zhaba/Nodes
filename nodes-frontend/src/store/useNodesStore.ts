import { create } from "zustand";

/**
 * useAppStore: Глобальное состояние пользовательского интерфейса и настроек.
 * Серверное состояние (Nodes, Cores, etc.) управляется через React Query.
 */
interface AppState {
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
  // Добавляйте сюда другие глобальные UI-переменные
}

export const useAppStore = create<AppState>()((set) => ({
  isSidebarOpen: true,
  setSidebarOpen: (isOpen: boolean) => set({ isSidebarOpen: isOpen }),
}));

// Экспортируем старое имя для совместимости, если где-то забыли обновить, 
// но в идеале нужно везде заменить на useAppStore.
/** @deprecated Use useAppStore instead */
export const useNodesStore = useAppStore;

