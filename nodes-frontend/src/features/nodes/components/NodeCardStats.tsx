import { cn } from "@/lib/utils";
import { CheckCircle2, Circle } from "lucide-react";

interface NodeCardStatsProps {
  completionCount: number;
  className?: string;
}

/**
 * Статистика узла (счётчик выполнений)
 */
export function NodeCardStats({
  completionCount,
  className,
}: NodeCardStatsProps) {
  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      {completionCount > 0 ? (
        <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
      ) : (
        <Circle className="w-4 h-4 text-muted-foreground" />
      )}
      <span className="text-muted-foreground">Выполнено:</span>
      <span className="font-semibold text-foreground">{completionCount}</span>
    </div>
  );
}
