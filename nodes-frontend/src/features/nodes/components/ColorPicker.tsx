import { cn } from "@/lib/utils"

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  colors?: string[]
  className?: string
}

/**
 * Предустановленные цвета для узлов
 */
const DEFAULT_COLORS = [
  '#8b5cf6', // violet - основной
  '#f97316', // orange
  '#3b82f6', // blue
  '#22c55e', // green
  '#ef4444', // red
  '#06b6d4', // cyan
  '#f43f5e', // rose
  '#eab308', // yellow
]

/**
 * Компонент выбора цвета узла
 */
export function ColorPicker({
  value,
  onChange,
  colors = DEFAULT_COLORS,
  className,
}: ColorPickerProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={cn(
            "h-8 w-8 rounded-full border-2 transition-all hover:scale-110",
            value === color
              ? "border-foreground ring-2 ring-primary ring-offset-2 dark:ring-offset-background"
              : "border-muted-foreground/20"
          )}
          style={{ backgroundColor: color }}
          aria-label={`Выбрать цвет ${color}`}
        />
      ))}
    </div>
  )
}
