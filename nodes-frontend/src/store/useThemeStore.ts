import { create } from "zustand"
import { persist } from "zustand/middleware"

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
  clearCache: () => void
  updateConfig: (config: ThemeConfig) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      config: {
        mode: "dark",
        colors: { light: {}, dark: {} },
      },
      isInitialized: false,
      setMode: (mode) => {
        set((state) => {
          const currentConfig = state.config || { mode: "dark", colors: { light: {}, dark: {} } }
          return {
            isInitialized: true,
            config: {
              ...currentConfig,
              mode,
              colors: currentConfig.colors || { light: {}, dark: {} }
            }
          }
        })
        get().applyTheme()
      },
      setColor: (token, value, mode) => {
        set((state) => {
          const currentConfig = state.config || { mode: "dark", colors: { light: {}, dark: {} } }
          const targetMode = mode || currentConfig.mode || "dark"
          const colors = currentConfig.colors || { light: {}, dark: {} }
          const newColors = { ...(colors[targetMode] || {}) }

          if (value === null) {
            delete newColors[token]
          } else {
            newColors[token] = value
          }

          return {
            isInitialized: true,
            config: {
              ...currentConfig,
              mode: currentConfig.mode || "dark",
              colors: {
                ...colors,
                [targetMode]: newColors,
              },
            },
          }
        })
        get().applyTheme()
      },
      applyPalette: (lightColors, darkColors) => {
        set((state) => {
          const currentConfig = state.config || { mode: "dark", colors: { light: {}, dark: {} } }
          return {
            isInitialized: true,
            config: {
              ...currentConfig,
              colors: {
                light: lightColors || {},
                dark: darkColors || {}
              }
            }
          }
        })
        get().applyTheme()
      },
      resetToDefaults: () => {
        set((state) => {
          const currentConfig = state.config || { mode: "dark", colors: { light: {}, dark: {} } }
          return {
            config: {
              ...currentConfig,
              colors: { light: {}, dark: {} }
            }
          }
        })
        get().applyTheme()
      },
      clearCache: () => {
        set({
          config: {
            mode: "dark",
            colors: { light: {}, dark: {} },
          },
          isInitialized: false
        })
        get().applyTheme()
      },
      applyTheme: () => {
        const config = get().config || {
          mode: "dark",
          colors: { light: {}, dark: {} },
        }
        const root = document.documentElement
        const mode = config.mode || "dark"
        const colors = config.colors || { light: {}, dark: {} }

        // Apply dark/light class
        if (mode === "dark") {
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
        const currentColors = colors[mode] || {}

        Object.entries(currentColors).forEach(([token, value]) => {
          if (token && value !== undefined && value !== null) {
            root.style.setProperty(token, value)
            if (token === "--primary" && !currentColors["--ring"]) {
               root.style.setProperty("--ring", value)
            }
          }
        })
      },
      updateConfig: (newConfig) => {
        const baseConfig = {
          mode: "dark" as ThemeMode,
          colors: { light: {}, dark: {} },
        }
        const mergedConfig = {
          mode: newConfig?.mode || baseConfig.mode,
          colors: {
            light: { ...baseConfig.colors.light, ...newConfig?.colors?.light },
            dark: { ...baseConfig.colors.dark, ...newConfig?.colors?.dark },
          }
        }
        set({ config: mergedConfig, isInitialized: true })
        get().applyTheme()
      }
    }),
    {
      name: "nodes-theme",
      partialize: (state) => ({ config: state.config }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Safeguard the state config before applying
          const baseConfig = {
            mode: "dark" as ThemeMode,
            colors: { light: {}, dark: {} },
          }
          state.config = {
            mode: state.config?.mode || baseConfig.mode,
            colors: {
              light: { ...baseConfig.colors.light, ...state.config?.colors?.light },
              dark: { ...baseConfig.colors.dark, ...state.config?.colors?.dark },
            }
          }
          state.applyTheme()
        }
      },
    }
  )
)
