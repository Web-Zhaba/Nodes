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
    <div className={cn("w-full bg-background/60 border border-white/5 backdrop-blur-md rounded-2xl p-4 shadow-sm", className)}>
      <div className="flex items-center justify-between mb-3 text-sm font-medium">
        <span className="flex items-center gap-2 text-muted-foreground uppercase tracking-wider text-xs font-semibold">
          <BrainCircuit className="w-4 h-4 text-primary" />
          Ёмкость дня (Mass)
        </span>
        <span className={cn("text-xs font-bold", isOverload ? "text-orange-500" : "text-primary")}>
          {currentMass} / {maxCapacity}
        </span>
      </div>

      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/50 inset-shadow-sm">
        <div
          className={cn(
            "h-full w-full flex-1 transition-all duration-500 ease-in-out",
            isOverload ? "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.6)]" : "bg-primary shadow-[0_0_10px_rgba(var(--primary),0.6)]"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {isOverload && (
        <p className="flex items-center gap-1.5 mt-3 text-xs text-orange-500/90 font-medium">
          <AlertTriangle className="w-3.5 h-3.5" />
          Система перегружена. Риск выгорания связей повышен. Вы уверены, что потянете?
        </p>
      )}
    </div>
  );
}
