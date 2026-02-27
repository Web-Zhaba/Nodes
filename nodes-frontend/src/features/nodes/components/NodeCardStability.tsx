import { cn } from "@/lib/utils";

interface NodeCardStabilityProps {
  stabilityScore: number;
  color?: string;
  className?: string;
}

/**
 * Прогресс-бар стабильности узла
 */
export function NodeCardStability({
  stabilityScore,
  color,
  className,
}: NodeCardStabilityProps) {
  // Цветовая кодировка стабильности
  const getStabilityColor = (score: number) => {
    if (score >= 70) return "text-green-500";
    if (score >= 30) return "text-yellow-500";
    return "text-red-500";
  };

  const getStabilityBg = (score: number) => {
    if (score >= 70) return "bg-green-500";
    if (score >= 30) return "bg-yellow-500";
    return "bg-red-500";
  };

  const colorClass = getStabilityColor(stabilityScore);

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground font-medium">Стабильность</span>
        <span className={cn("font-semibold", colorClass)}>
          {Math.round(stabilityScore)}/100
        </span>
      </div>
      <div className="h-1.5 bg-muted/60 rounded-full overflow-hidden relative">
        <div
          className={cn(
            "absolute top-0 left-0 h-full rounded-full transition-all duration-500 shadow-sm",
            !color && getStabilityBg(stabilityScore),
          )}
          style={{
            width: `${stabilityScore}%`,
            ...(color && {
              backgroundColor: color,
              boxShadow: `0 0 10px ${color}80`
            })
          }}
        />
      </div>
    </div>
  );
}
