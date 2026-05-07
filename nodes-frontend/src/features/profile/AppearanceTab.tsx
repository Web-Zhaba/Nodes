import { Button } from "@/components/ui/button";
import { useThemeStore } from "@/store/useThemeStore";
import { Sun, Moon, RotateCcw } from "lucide-react";
import { toast } from "sonner";

const THEME_PRESETS = [
  {
    name: "Default (Cyber-Zen)",
    light: {},
    dark: {}
  },
  {
    name: "Terminal",
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

const FONT_OPTIONS = [
  { label: "По умолчанию (Plus Jakarta)", value: "Plus Jakarta Sans, sans-serif" },
  { label: "Классический (Lora Serif)", value: "Lora, serif" },
  { label: "Машинописный (Plex Mono)", value: "IBM Plex Mono, monospace" },
  { label: "Округлый (Rounded)", value: "ui-rounded, 'Nunito', sans-serif" },
];

const RADIUS_OPTIONS = [
  { label: "Острые (0px)", value: "-1000px" },
  { label: "Минимальные (4px)", value: "0.25rem" },
  { label: "Мягкие (14px)", value: "0.9rem" },
  { label: "Круглые (24px)", value: "1.5rem" },
];

const CUSTOM_TOKENS = [
  { label: "Акцентный цвет", token: "--primary" },
  { label: "Фон страницы", token: "--background" },
  { label: "Фон карточек", token: "--card" },
  { label: "Текст", token: "--foreground" },
  { label: "Приглушенный", token: "--muted" },
  { label: "Границы", token: "--border" },
  { label: "Вторичный", token: "--secondary" },
  { label: "Второстепенный акцент", token: "--accent" },
];

export function AppearanceTab() {
  const { config, setMode, setColor, applyPalette, resetToDefaults } = useThemeStore();
  const isDark = config.mode === "dark";

  const toggleTheme = () => {
    setMode(isDark ? "light" : "dark");
    toast.success(`Включена ${isDark ? "светлая" : "тёмная"} тема`);
  };

  return (
    <div className="bg-background/40 backdrop-blur-xl border border-border/40 rounded-[2rem] p-6 sm:p-8 shadow-xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Внешний вид</h2>
            <p className="text-sm text-muted-foreground">Настройте визуальный резонанс интерфейса.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">{isDark ? "Dark Mode" : "Light Mode"}</span>
            <Button variant="outline" size="icon" onClick={toggleTheme} className="rounded-xl shrink-0 h-10 w-10 shadow-sm">
              {isDark ? <Sun className="w-4 h-4 text-orange-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </Button>
          </div>
        </div>
      </section>

      {/* Presets Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-4 bg-primary/50 rounded-full" />
          <h3 className="font-bold">Готовые палитры</h3>
        </div>
        <div className="flex flex-wrap gap-3">
            {THEME_PRESETS.map((preset) => {
              // Check if current matches
              // A simple heuristic: if primary matches
              const presetPrimary = (preset as any)[config.mode]["--primary"];
              const currentPrimary = (config.colors as any)[config.mode]["--primary"];
              const isSelected = presetPrimary === currentPrimary;
              
              return (
                <Button
                  key={preset.name}
                  variant={isSelected ? "default" : "outline"}
                  onClick={() => {
                    applyPalette(preset.light, preset.dark);
                    toast.success(`Применена палитра: ${preset.name}`);
                  }}
                  className="rounded-xl text-xs"
                >
                  {preset.name}
                </Button>
              );
            })}
        </div>
        </section>

      <section className="p-5 rounded-[1.5rem] border border-border/40 bg-muted/10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold">Тонкая настройка</h3>
            <p className="text-xs text-muted-foreground">Персонализация переменных ({isDark ? "тёмная" : "светлая"} тема)</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => { resetToDefaults(); toast.success("Сброшено по умолчанию"); }}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 bg-background border border-border/50 rounded-xl">
            <div className="min-w-0 flex-1 mr-4">
              <p className="text-sm font-medium truncate">Шрифт</p>
            </div>
            <select
              className="bg-muted text-sm rounded-lg border-0 focus:ring-2 focus:ring-primary py-1 px-2 shrink-0 cursor-pointer max-w-[120px]"
              value={(config.colors as any)[config.mode]["--font-sans"] || ""}
              onChange={(e) => setColor("--font-sans", e.target.value || null)}
            >
              <option value="">По умолчанию</option>
              {FONT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-background border border-border/50 rounded-xl">
            <div className="min-w-0 flex-1 mr-4">
              <p className="text-sm font-medium truncate">Скругления (Radius)</p>
            </div>
            <select
              className="bg-muted text-sm rounded-lg border-0 focus:ring-2 focus:ring-primary py-1 px-2 shrink-0 cursor-pointer max-w-[120px]"
              value={(config.colors as any)[config.mode]["--radius"] || ""}
              onChange={(e) => setColor("--radius", e.target.value || null)}
            >
              <option value="">По умолчанию</option>
              {RADIUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-3 p-3 bg-background border border-border/50 rounded-xl">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Спецэффекты (Scanlines)</p>
              <span className="text-xs font-mono opacity-50">{Math.round((parseFloat((config.colors as any)[config.mode]["--effects-opacity"] || "0")) * 100)}%</span>
            </div>
            <input 
              type="range" min="0" max="1" step="0.05" 
              value={(config.colors as any)[config.mode]["--effects-opacity"] !== undefined ? (config.colors as any)[config.mode]["--effects-opacity"] : 0}
              onChange={(e) => setColor("--effects-opacity", e.target.value)}
              className="w-full accent-primary h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {CUSTOM_TOKENS.map(({ label, token }) => {
            const currentValue = (config.colors as any)[config.mode][token];
            return (
              <div key={token} className="flex items-center justify-between p-3 bg-background border border-border/50 rounded-xl">
                <div className="min-w-0 flex-1 mr-4">
                  <p className="text-sm font-medium truncate">{label}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {currentValue && (
                    <button 
                      onClick={() => setColor(token, null)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      title="Сбросить цвет"
                    >
                      Сброс
                    </button>
                  )}
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border border-border/50 cursor-pointer shrink-0">
                    <input
                      type="color"
                      value={currentValue?.startsWith("#") ? currentValue : "#888888"}
                      onChange={(e) => setColor(token, e.target.value)}
                      className="absolute inset-[-10px] w-[50px] h-[50px] cursor-pointer"
                      title="Выбрать цвет"
                    />
                    {/* Visual indicator if value is not hex (e.g. oklch from index.css) */}
                    {!currentValue && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-muted">
                        <span className="text-[10px] opacity-50">?</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
