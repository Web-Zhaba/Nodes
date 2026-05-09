import { create } from "zustand";
import i18n from "../lib/i18n";

interface AppState {
  isSidebarOpen: boolean;
  language: string;
  toggleSidebar: () => void;
  setLanguage: (lang: string) => void;
}

export const useAppStore = create<AppState>()((set) => ({
  isSidebarOpen: true,
  language: i18n.language || "ru",
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setLanguage: (lang: string) => {
    i18n.changeLanguage(lang);
    set({ language: lang });
  },
}));
