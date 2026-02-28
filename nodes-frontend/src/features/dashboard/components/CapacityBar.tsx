import { cn } from "@/lib/utils";
import { BrainCircuit, AlertTriangle } from "lucide-react";

interface CapacityBarProps {
  currentMass: number;
  maxCapacity: number;
  className?: string; // Optional custom string
}

export function CapacityBar({ currentMass, maxCapacity, className }: CapacityBarProps) {
  const percentage = Math.min((currentMass / maxCapacity) * 100, 100);
  const isOverload = currentMass > maxCapacity;

  return (
    <div className={cn("w-full bg-background/80 border border-white/5 rounded-2xl p-4 shadow-sm", className)}>
      <div className="flex items-center justify-between mb-3 text-sm font-medium">
        <span className="flex items-center gap-2 text-muted-foreground uppercase tracking-wider text-xs font-semibold">
          <BrainCircuit className="w-4 h-4 text-primary" />
          Рекомендуемая нагрузка
        </span>
        <span className={cn("text-xs font-bold", isOverload ? "text-orange-500" : "text-primary")}>
          {currentMass} / {maxCapacity}
        </span>
      </div>

      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted/30 shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]">
        <div
          className={cn(
            "h-full transition-all duration-700 ease-out rounded-full",
            isOverload
              ? "bg-gradient-to-r from-orange-600 to-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.4)]"
              : "bg-gradient-to-r from-primary to-primary/60 shadow-[0_0_12px_rgba(var(--primary),0.3)]"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {isOverload && (
        <p className="flex items-center gap-1.5 mt-3 text-xs text-orange-500/90 font-medium">
          <AlertTriangle className="w-3.5 h-3.5" />
          Вы выбрали много задач на сегодня, предстоит сложный день
        </p>
      )}
    </div>
  );
}
