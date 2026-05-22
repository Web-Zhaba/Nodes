import { Button } from "@/components/ui/button"
import { Sun, Moon, RotateCcw } from 'lucide-react'
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { useFormContext } from "react-hook-form"
import { ProGate, useSubscription } from "@/features/subscription"
import { useAuth } from "@/hooks/useAuth"

const THEME_PRESETS = [
  {
    name: "Default (Cyber-Zen)",
    isPro: false,
    light: {},
    dark: {}
  },
  {
    name: "Terminal",
    isPro: true,
    light: {
      "--primary": "#16a34a", 
      "--background": "#f0fdf4", 
      "--card": "#dcfce7",
      "--foreground": "#14532d",
      "--muted": "#bbf7d0",
      "--border": "#86efac",
      "--radius": "-1000px",
      "--font-sans": "IBM Plex Mono, ui-monospace, monospace",
      "--glow-strength": "0.3",
      "--effects-opacity": "0.6",
    },
    dark: {
      "--primary": "#22c55e", 
      "--background": "#000000", 
      "--card": "#09090b",
      "--foreground": "#4ade80",
      "--muted": "#000000",
      "--border": "#166534",
      "--radius": "-1000px",
      "--font-sans": "IBM Plex Mono, ui-monospace, monospace",
      "--glow-strength": "0.8",
      "--effects-opacity": "0.8",
    }
  },
  {
    name: "Neumorphism",
    isPro: true,
    light: {
      "--primary": "#4f46e5",
      "--background": "#e0e5ec", 
      "--card": "#e0e5ec",
      "--foreground": "#4b5563",
      "--border": "#d1d9e6",
      "--radius": "2rem",
      "--font-sans": "ui-rounded, 'Nunito', sans-serif",
      "--glow-strength": "0",
      "--effects-opacity": "0",
    },
    dark: {
      "--primary": "#818cf8",
      "--background": "#2d343c",
      "--card": "#2d343c",
      "--foreground": "#e5e7eb",
      "--border": "#3a424b",
      "--radius": "2rem",
      "--font-sans": "ui-rounded, 'Nunito', sans-serif",
      "--glow-strength": "0",
      "--effects-opacity": "0",
    }
  },
  {
    name: "Synthwave",
    isPro: true,
    light: { 
      "--primary": "#db2777", 
      "--background": "#fdf2f8", 
      "--card": "#fce7f3",
      "--foreground": "#831843",
      "--border": "#f9a8d4",
      "--radius": "0.75rem",
      "--font-sans": "Plus Jakarta Sans, sans-serif",
      "--glow-strength": "0.6",
      "--effects-opacity": "0.2",
    },
    dark: { 
      "--primary": "#f472b6", 
      "--background": "#0c0a09", 
      "--card": "#1c1917",
      "--foreground": "#fce7f3",
      "--border": "#db2777",
      "--radius": "0.75rem",
      "--font-sans": "Plus Jakarta Sans, sans-serif",
      "--glow-strength": "1.2",
      "--effects-opacity": "0.4",
    }
  },
  {
    name: "Paper",
    isPro: true,
    light: { 
      "--primary": "#44403c", 
      "--background": "#f5f5f4", 
      "--card": "#fafaf9",
      "--foreground": "#1c1917",
      "--border": "#e7e5e4",
      "--radius": "0.1rem",
      "--font-sans": "Lora, serif"
    },
    dark: { 
      "--primary": "#d6d3d1", 
      "--background": "#1c1917", 
      "--card": "#292524",
      "--foreground": "#fafaf9",
      "--border": "#44403c",
      "--radius": "0.1rem",
      "--font-sans": "Lora, serif"
    }
  }
];

export function AppearanceTab() {
  const { t } = useTranslation()
  const { setValue, watch } = useFormContext()
  const { user } = useAuth()
  const { isPro } = useSubscription(user?.id)
  
  // Watch themeConfig from form - this is our source of truth
  const formThemeConfig = watch("themeConfig")
  const isDark = formThemeConfig?.mode === "dark"

  const FONT_OPTIONS = [
    { label: t("profile.appearance.fonts.jakarta", "По умолчанию (Plus Jakarta)"), value: "Plus Jakarta Sans, sans-serif" },
    { label: t("profile.appearance.fonts.lora", "Классический (Lora Serif)"), value: "Lora, serif" },
    { label: t("profile.appearance.fonts.plex", "Машинописный (Plex Mono)"), value: "IBM Plex Mono, monospace" },
    { label: t("profile.appearance.fonts.rounded", "Округлый (Rounded)"), value: "ui-rounded, 'Nunito', sans-serif" },
  ]

  const RADIUS_OPTIONS = [
    { label: t("profile.appearance.radii.sharp", "Острые (0px)"), value: "-1000px" },
    { label: t("profile.appearance.radii.minimal", "Минимальные (4px)"), value: "0.25rem" },
    { label: t("profile.appearance.radii.soft", "Мягкие (14px)"), value: "0.9rem" },
    { label: t("profile.appearance.radii.round", "Круглые (24px)"), value: "1.5rem" },
  ]

  const CUSTOM_TOKENS = [
    { label: t("profile.appearance.tokens.primary", "Акцентный цвет"), token: "--primary" },
    { label: t("profile.appearance.tokens.background", "Фон страницы"), token: "--background" },
    { label: t("profile.appearance.tokens.card", "Фон карточек"), token: "--card" },
    { label: t("profile.appearance.tokens.foreground", "Текст"), token: "--foreground" },
    { label: t("profile.appearance.tokens.muted", "Приглушенный"), token: "--muted" },
    { label: t("profile.appearance.tokens.border", "Границы"), token: "--border" },
    { label: t("profile.appearance.tokens.secondary", "Вторичный"), token: "--secondary" },
    { label: t("profile.appearance.tokens.accent", "Второстепенный акцент"), token: "--accent" },
  ]

  const setFormMode = (mode: "light" | "dark") => {
    setValue("themeConfig", { ...formThemeConfig, mode }, { shouldDirty: true })
  }

  const setFormColor = (token: string, value: string | null) => {
    const mode = formThemeConfig.mode
    const newColors = { ...formThemeConfig.colors }
    const modeColors = { ...newColors[mode] }
    
    if (value === null) {
      delete modeColors[token]
    } else {
      modeColors[token] = value
    }
    
    newColors[mode] = modeColors
    setValue("themeConfig", { ...formThemeConfig, colors: newColors }, { shouldDirty: true })
  }

  const applyFormPalette = (light: any, dark: any) => {
    setValue("themeConfig", { 
      ...formThemeConfig, 
      colors: { light, dark } 
    }, { shouldDirty: true })
  }

  const resetFormToDefaults = () => {
    setValue("themeConfig", { 
      ...formThemeConfig, 
      colors: { light: {}, dark: {} } 
    }, { shouldDirty: true })
  }

  const toggleTheme = () => {
    const nextMode = isDark ? "light" : "dark"
    setFormMode(nextMode)
    toast.info(t("profile.appearance.themeToggled", `Режим изменён: ${nextMode === "dark" ? "Тёмный" : "Светлый"} (сохраните для применения)`))
  }

  return (
    <div className="bg-background/40 backdrop-blur-xl border border-border/40 rounded-[2rem] p-6 sm:p-8 shadow-xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">{t("profile.appearance.title", "Внешний вид")}</h2>
            <p className="text-sm text-muted-foreground">{t("profile.appearance.subtitle", "Настройте визуальный резонанс интерфейса.")}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={toggleTheme} className="rounded-xl shrink-0 h-10 w-10 shadow-sm" title={isDark ? "Переключить на светлый" : "Переключить на тёмный"}>
              {isDark ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-orange-400" />}
            </Button>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest hidden sm:inline">
              {t("profile.appearance.themeMode", { mode: isDark ? "Dark" : "Light" })}
            </span>
          </div>
        </div>
      </section>

      {/* Presets Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-4 bg-primary/50 rounded-full" />
          <h3 className="font-bold">{t("profile.appearance.presets", "Готовые палитры")}</h3>
        </div>
        <div className="flex flex-wrap gap-3">
            {THEME_PRESETS.map((preset) => {
              const mode = formThemeConfig.mode
              const presetPrimary = (preset as any)[mode]["--primary"]
              const currentPrimary = (formThemeConfig.colors as any)[mode]["--primary"]
              const isSelected = presetPrimary === currentPrimary
              const isLocked = preset.isPro && !isPro

              const button = (
                <Button
                  key={preset.name}
                  variant={isSelected ? "default" : "outline"}
                  onClick={() => {
                    if (isLocked) return
                    applyFormPalette(preset.light, preset.dark)
                    toast.info(t("profile.appearance.presetSelected", `Палитра «${preset.name}» выбрана — нажмите Сохранить для применения`))
                  }}
                  className="rounded-xl text-xs"
                >
                  {preset.name}
                </Button>
              )

              return isLocked
                ? (
                  <ProGate key={preset.name} feature="themes" overlay={false}>
                    {button}
                  </ProGate>
                )
                : button
            })}
        </div>
        </section>

      <section className="p-5 rounded-[1.5rem] border border-border/40 bg-muted/10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold">{t("profile.appearance.fineTuning", "Тонкая настройка")}</h3>
            <p className="text-xs text-muted-foreground">{t("profile.appearance.personalization", { mode: isDark ? t("profile.appearance.dark") : t("profile.appearance.light") })}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => { 
            resetFormToDefaults() 
            toast.info(t("profile.appearance.colorsReset", "Цвета сброшены — нажмите Сохранить для применения")) 
          }}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 bg-background border border-border/50 rounded-xl">
            <div className="min-w-0 flex-1 mr-4">
              <p className="text-sm font-medium truncate">{t("profile.appearance.font", "Шрифт")}</p>
            </div>
            <select
              className="bg-muted text-sm rounded-lg border-0 focus:ring-2 focus:ring-primary py-1 px-2 shrink-0 cursor-pointer max-w-[120px]"
              value={(formThemeConfig.colors as any)[formThemeConfig.mode]["--font-sans"] || ""}
              onChange={(e) => setFormColor("--font-sans", e.target.value || null)}
            >
              <option value="">{t("profile.appearance.default", "По умолчанию")}</option>
              {FONT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-background border border-border/50 rounded-xl">
            <div className="min-w-0 flex-1 mr-4">
              <p className="text-sm font-medium truncate">{t("profile.appearance.radius", "Скругления (Radius)")}</p>
            </div>
            <select
              className="bg-muted text-sm rounded-lg border-0 focus:ring-2 focus:ring-primary py-1 px-2 shrink-0 cursor-pointer max-w-[120px]"
              value={(formThemeConfig.colors as any)[formThemeConfig.mode]["--radius"] || ""}
              onChange={(e) => setFormColor("--radius", e.target.value || null)}
            >
              <option value="">{t("profile.appearance.default", "По умолчанию")}</option>
              {RADIUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-3 p-3 bg-background border border-border/50 rounded-xl">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{t("profile.appearance.effects", "Спецэффекты (Scanlines)")}</p>
              <span className="text-xs font-mono opacity-50">{Math.round((parseFloat((formThemeConfig.colors as any)[formThemeConfig.mode]["--effects-opacity"] || "0")) * 100)}%</span>
            </div>
            <input 
              type="range" min="0" max="1" step="0.05" 
              value={(formThemeConfig.colors as any)[formThemeConfig.mode]["--effects-opacity"] !== undefined ? (formThemeConfig.colors as any)[formThemeConfig.mode]["--effects-opacity"] : 0}
              onChange={(e) => setFormColor("--effects-opacity", e.target.value)}
              className="w-full accent-primary h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {CUSTOM_TOKENS.map(({ label, token }) => {
            const currentValue = (formThemeConfig.colors as any)[formThemeConfig.mode][token]
            return (
              <div key={token} className="flex items-center justify-between p-3 bg-background border border-border/50 rounded-xl">
                <div className="min-w-0 flex-1 mr-4">
                  <p className="text-sm font-medium truncate">{label}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {currentValue && (
                    <button 
                      type="button"
                      onClick={() => setFormColor(token, null)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      title={t("profile.appearance.resetColor", "Сбросить цвет")}
                    >
                      {t("profile.appearance.reset", "Сброс")}
                    </button>
                  )}
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border border-border/50 cursor-pointer shrink-0">
                    <input
                      type="color"
                      value={currentValue?.startsWith("#") ? currentValue : "#888888"}
                      onChange={(e) => setFormColor(token, e.target.value)}
                      className="absolute inset-[-10px] w-[50px] h-[50px] cursor-pointer"
                      title={t("profile.appearance.selectColor", "Выбрать цвет")}
                    />
                    {!currentValue && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-muted">
                        <span className="text-[10px] opacity-50">?</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
