import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Check } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";
import type { Node } from "@/types";

interface QuantityControlProps {
  node: Node;
  currentValue: number;
  onImpulse: (value: number) => Promise<void>;
  onUpdateValue: (value: number) => void;
  className?: string;
}

/**
 * Контрол для Quantity узлов (счётчик)
 */
export function QuantityControl({
  node,
  currentValue,
  onImpulse,
  onUpdateValue,
  className,
}: QuantityControlProps) {
  const [isPending, setIsPending] = useState(false);
  const [localValue, setLocalValue] = useState<number | null>(null);
  const [hasSavedToday, setHasSavedToday] = useState(false);
  const [savedValue, setSavedValue] = useState<number | null>(null);

  // Используем локальное значение если оно есть, иначе значение из пропсов
  const displayValue = localValue ?? currentValue;
  const targetValue = node.target_value || 10;
  const progress = Math.min((displayValue / targetValue) * 100, 100);

  const handleIncrement = () => {
    const newValue = displayValue + 1;
    setLocalValue(newValue); // Мгновенное обновление локально
    onUpdateValue(newValue); // Отправка в store
  };

  const handleDecrement = () => {
    if (displayValue > 0) {
      const newValue = displayValue - 1;
      setLocalValue(newValue); // Мгновенное обновление локально
      onUpdateValue(newValue); // Отправка в store
    }
  };

  const handleSubmit = async () => {
    if (isPending || displayValue === 0) return;

    setIsPending(true);

    try {
      // Мы отправляем 0, так как само значение уже сохранено через onUpdateValue ранее.
      // onImpulse здесь нужен только для фиксации события (инкремента счетчика выполнений).
      await onImpulse(0);

      if (displayValue >= targetValue) {
        toast.success(
          displayValue > targetValue ? "Перевыполнение!" : "Цель достигнута!",
          {
            description: `${displayValue}/${targetValue} — отлично!`,
          },
        );
      } else {
        toast.success("Прогресс сохранён", {
          description: `${displayValue}/${targetValue}`,
        });
      }

      // Сбрасываем локальное значение после успешного сохранения
      setLocalValue(null);
      setHasSavedToday(true);
      setSavedValue(displayValue); // Фиксируем значение
    } catch (error) {
      toast.error("Ошибка", {
        description: "Не удалось сохранить прогресс",
      });
    } finally {
      setIsPending(false);
    }
  };

  const isGoalReached = displayValue >= targetValue;
  const isOverdrive = displayValue > targetValue; // Перевыполнение цели

  return (
    <div className={cn("w-full", className)}>
      {/* Прогресс бар */}
      <div className="space-y-1 h-12.5 text-shadow-sm">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground font-medium">Прогресс количества</span>
          <span
            className={cn(
              "font-medium",
              isOverdrive && "text-purple-500 font-semibold",
              isGoalReached && !isOverdrive && "text-green-500",
              !isGoalReached && "text-blue-500",
            )}
          >
            {displayValue} / {targetValue}
          </span>
        </div>
        <div className="h-1.5 bg-muted/60 rounded-full overflow-hidden shadow-inner relative">
          <motion.div
            initial={false}
            animate={{
              scaleX: progress / 100,
              backgroundColor: isOverdrive
                ? "#a855f7"
                : isGoalReached
                  ? "#22c55e"
                  : "#3b82f6"
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
              "absolute inset-0 origin-left rounded-full shadow",
              isOverdrive
                ? "shadow-[0_0_8px_rgba(168,85,247,0.8)]"
                : isGoalReached
                  ? "shadow-[0_0_8px_rgba(34,197,94,0.8)]"
                  : "shadow-[0_0_8px_rgba(59,130,246,0.6)]",
            )}
          />
        </div>
        {isOverdrive && (
          <p className="text-[10px] text-purple-500 text-center font-bold tracking-wider uppercase mt-1">
            +{displayValue - targetValue} OVERDRIVE
          </p>
        )}
      </div>

      {/* Кнопки */}
      <div className="space-y-3 mt-4">
        {/* Кнопки +/- */}
        <div className="flex items-center justify-center gap-4">
          <motion.div whileTap={displayValue > 0 && !isPending ? { scale: 0.85 } : {}}>
            <Button
              variant="outline"
              size="icon"
              onClick={handleDecrement}
              disabled={displayValue === 0 || isPending}
              className="h-11 w-11 rounded-full bg-background/50 border-white/10 shadow-sm"
              data-testid="decrement-button"
            >
              <Minus className="w-5 h-5 text-muted-foreground" />
            </Button>
          </motion.div>

          <span
            className={cn(
              "text-3xl font-black w-20 text-center drop-shadow-sm font-mono tracking-tight",
              isOverdrive && "text-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]",
              isGoalReached && !isOverdrive && "text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]",
            )}
          >
            {displayValue}
          </span>

          <motion.div whileTap={!isPending ? { scale: 0.85 } : {}}>
            <Button
              variant="outline"
              size="icon"
              onClick={handleIncrement}
              disabled={isPending}
              className="h-11 w-11 rounded-full bg-background/50 border-white/10 shadow-sm"
              data-testid="increment-button"
            >
              <Plus className="w-5 h-5 text-muted-foreground" />
            </Button>
          </motion.div>
        </div>

        {/* Кнопка завершения */}
        <motion.div
          whileTap={!isPending && displayValue > 0 && !hasSavedToday ? { scale: 0.97 } : {}}
          className="w-full"
        >
          <Button
            onClick={handleSubmit}
            disabled={isPending || displayValue === 0}
            className={cn(
              "w-full transition-all shadow-sm font-medium",
              hasSavedToday && "bg-green-500 hover:bg-green-600 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]",
              isOverdrive &&
              !hasSavedToday &&
              "bg-purple-600 hover:bg-purple-700 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)]",
              isGoalReached &&
              !isOverdrive &&
              !hasSavedToday &&
              "bg-green-500 hover:bg-green-600 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]",
              !isGoalReached && !hasSavedToday && displayValue > 0 && "bg-primary hover:bg-primary/90"
            )}
            size="lg"
          >
            <Check className="w-5 h-5 mr-2" />
            {hasSavedToday
              ? "Сохранено!"
              : isOverdrive
                ? "Сохранить Overdrive!"
                : isGoalReached
                  ? "Сохранить успех!"
                  : "Сохранить прогресс"}
          </Button>
        </motion.div>

        {(hasSavedToday || (currentValue >= targetValue)) ? (
          <p className="text-xs text-center text-green-500/80 font-medium flex items-center justify-center gap-1">
            <Check className="w-3 h-3" />
            Сегодня уже выполнено на {hasSavedToday && savedValue !== null ? savedValue : currentValue} / {targetValue}
          </p>
        ) : (
          <p className="text-xs text-center text-muted-foreground/70">
            Сегодня еще не выполнялось
          </p>
        )}
      </div>
    </div>
  );
}
