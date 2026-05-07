import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/lib/supabase";

export type ThemeMode = "light" | "dark";

export interface ThemeConfig {
  mode: ThemeMode;
  colors: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
}

interface ThemeState {
  config: ThemeConfig;
  setMode: (mode: ThemeMode) => void;
  setColor: (token: string, value: string | null, mode?: ThemeMode) => void;
  applyTheme: () => void;
  applyPalette: (lightColors: Record<string, string>, darkColors: Record<string, string>) => void;
  resetToDefaults: () => void;
  syncToCloud: () => Promise<void>;
  loadFromCloud: (userId: string) => Promise<void>;
}

const DEFAULT_CONFIG: ThemeConfig = {
  mode: "light",
  colors: {
    light: {},
    dark: {},
  },
};

// Variable to store the timeout ID for debouncing
let syncTimeoutId: ReturnType<typeof setTimeout> | null = null;

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      config: {
        mode: (localStorage.getItem("theme") as ThemeMode) || "light",
        colors: { light: {}, dark: {} },
      },
      setMode: (mode) => {
        set((state) => ({ config: { ...state.config, mode } }));
        get().applyTheme();
        get().syncToCloud();
      },
      setColor: (token, value, mode) => {
        set((state) => {
          const targetMode = mode || state.config.mode;
          const newColors = { ...state.config.colors[targetMode] };
          
          if (value === null) {
            delete newColors[token];
          } else {
            newColors[token] = value;
          }

          return {
            config: {
              ...state.config,
              colors: {
                ...state.config.colors,
                [targetMode]: newColors,
              },
            },
          };
        });
        get().applyTheme();
        get().syncToCloud();
      },
      applyPalette: (lightColors, darkColors) => {
        set((state) => ({
          config: {
            ...state.config,
            colors: { light: lightColors, dark: darkColors }
          }
        }));
        get().applyTheme();
        get().syncToCloud();
      },
      resetToDefaults: () => {
        set((state) => ({
          config: { ...state.config, colors: { light: {}, dark: {} } }
        }));
        get().applyTheme();
        get().syncToCloud();
      },
      applyTheme: () => {
        const { config } = get();
        const root = document.documentElement;

        // Apply dark/light class
        if (config.mode === "dark") {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }

        // Reset all previously set inline variables (we need a way to clear them)
        const knownTokens = [
          "--background", "--foreground", "--card", "--card-foreground", 
          "--popover", "--popover-foreground", "--primary", "--primary-foreground", 
          "--secondary", "--secondary-foreground", "--muted", "--muted-foreground", 
          "--accent", "--accent-foreground", "--destructive", "--destructive-foreground", 
          "--border", "--input", "--ring", "--radius", "--font-sans",
          "--glow-strength", "--effects-opacity"
        ];
        knownTokens.forEach(t => root.style.removeProperty(t));

        // Apply custom colors as inline CSS variables
        const currentColors = config.colors[config.mode] || {};
        
        Object.entries(currentColors).forEach(([token, value]) => {
          root.style.setProperty(token, value);
          // Special handling: if primary is changed, usually we want the ring to match
          if (token === "--primary" && !currentColors["--ring"]) {
             root.style.setProperty("--ring", value);
          }
        });
      },
      syncToCloud: async () => {
        // Clear the previous timeout if it exists
        if (syncTimeoutId) {
          clearTimeout(syncTimeoutId);
        }

        // Set a new timeout to debounce the sync (wait 1 second after last change)
        syncTimeoutId = setTimeout(async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) return;
          
          const { config } = get();
          const { error } = await supabase
            .from("profiles")
            .update({ theme_config: config })
            .eq("id", session.user.id);
            
          if (error) console.error("Theme sync error:", error);
        }, 1000);
      },
      loadFromCloud: async (userId: string) => {
        const { data, error } = await supabase
          .from("profiles")
          .select("theme_config")
          .eq("id", userId)
          .single();
          
        if (error || !data?.theme_config) return;
        
        const cloudConfig = data.theme_config as Partial<ThemeConfig>;
        if (cloudConfig.colors) {
           set((state) => ({
             config: { ...state.config, ...cloudConfig } as ThemeConfig
           }));
           get().applyTheme();
        }
      }
    }),
    {
      name: "nodes-theme-storage",
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.applyTheme();
        }
      },
    }
  )
);
