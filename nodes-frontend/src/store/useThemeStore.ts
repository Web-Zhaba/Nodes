import { create } from "zustand"
import { persist } from "zustand/middleware"
import { supabase } from "@/lib/supabase"

export type ThemeMode = "light" | "dark"

export interface ThemeConfig {
  mode: ThemeMode
  colors: {
    light: Record<string, string>
    dark: Record<string, string>
  }
}

interface ThemeState {
  config: ThemeConfig
  isInitialized: boolean
  setMode: (mode: ThemeMode) => void
  setColor: (token: string, value: string | null, mode?: ThemeMode) => void
  applyTheme: () => void
  applyPalette: (lightColors: Record<string, string>, darkColors: Record<string, string>) => void
  resetToDefaults: () => void
  loadFromCloud: (userId: string) => Promise<void>
  updateConfig: (config: ThemeConfig) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      config: {
        mode: "light",
        colors: { light: {}, dark: {} },
      },
      isInitialized: false,
      setMode: (mode) => {
        set((state) => ({
          isInitialized: true,
          config: { ...state.config, mode }
        }))
        get().applyTheme()
      },
      setColor: (token, value, mode) => {
        set((state) => {
          const targetMode = mode || state.config.mode
          const newColors = { ...state.config.colors[targetMode] }

          if (value === null) {
            delete newColors[token]
          } else {
            newColors[token] = value
          }

          return {
            isInitialized: true,
            config: {
              ...state.config,
              colors: {
                ...state.config.colors,
                [targetMode]: newColors,
              },
            },
          }
        })
        get().applyTheme()
      },
      applyPalette: (lightColors, darkColors) => {
        set((state) => ({
          isInitialized: true,
          config: {
            ...state.config,
            colors: { light: lightColors, dark: darkColors }
          }
        }))
        get().applyTheme()
      },
      resetToDefaults: () => {
        set((state) => ({
          config: { ...state.config, colors: { light: {}, dark: {} } }
        }))
        get().applyTheme()
      },
      applyTheme: () => {
        const { config } = get()
        const root = document.documentElement

        // Apply dark/light class
        if (config.mode === "dark") {
          root.classList.add("dark")
        } else {
          root.classList.remove("dark")
        }

        // Reset all previously set inline variables
        const knownTokens = [
          "--background", "--foreground", "--card", "--card-foreground",
          "--popover", "--popover-foreground", "--primary", "--primary-foreground",
          "--secondary", "--secondary-foreground", "--muted", "--muted-foreground",
          "--accent", "--accent-foreground", "--destructive", "--destructive-foreground",
          "--border", "--input", "--ring", "--radius", "--font-sans",
          "--glow-strength", "--effects-opacity"
        ]
        knownTokens.forEach(t => root.style.removeProperty(t))

        // Apply custom colors as inline CSS variables
        const currentColors = config.colors[config.mode] || {}

        Object.entries(currentColors).forEach(([token, value]) => {
          root.style.setProperty(token, value)
          if (token === "--primary" && !currentColors["--ring"]) {
             root.style.setProperty("--ring", value)
          }
        })
      },
      loadFromCloud: async (userId: string) => {
        if (get().isInitialized) return

        const { data, error } = await supabase
          .from("profiles")
          .select("theme_config")
          .eq("id", userId)
          .single()

        if (error || !data?.theme_config) {
          set({ isInitialized: true })
          return
        }

        const cloudConfig = data.theme_config as Partial<ThemeConfig>
        if (cloudConfig.colors) {
           set({
             isInitialized: true,
             config: { ...get().config, ...cloudConfig } as ThemeConfig
           })
           get().applyTheme()
        } else {
          set({ isInitialized: true })
        }
      },
      updateConfig: (newConfig) => {
        set({ config: newConfig, isInitialized: true })
        get().applyTheme()
      }
    }),
    {
      name: "nodes-theme",
      partialize: (state) => ({ config: state.config }),
      onRehydrateStorage: () => (state) => {
        if (state) state.applyTheme()
      },
    }
  )
)
