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
  };

  const handleDecrement = () => {
    if (displayValue > 0) {
      const newValue = displayValue - 1;
      setLocalValue(newValue); // Мгновенное обновление локально
    }
  };

  const handleSubmit = async (overrideValue?: number) => {
    const valueToSubmit = overrideValue !== undefined ? overrideValue : displayValue;

    if (isPending || valueToSubmit === 0) return;

    setIsPending(true);

    try {
      if (localValue !== null || overrideValue !== undefined) {
        onUpdateValue(valueToSubmit);
      }
      // onImpulse здесь нужен для фиксации события (инкремента счетчика выполнений).
      await onImpulse(0);

      if (valueToSubmit >= targetValue) {
        toast.success(
          valueToSubmit > targetValue ? "Перевыполнение!" : "Цель достигнута!",
          {
            description: `${valueToSubmit}/${targetValue} — отлично!`,
          },
        );
      } else {
        toast.success("Прогресс сохранён", {
          description: `${valueToSubmit}/${targetValue}`,
        });
      }

      // Сбрасываем локальное значение после успешного сохранения
      setLocalValue(null);
      setHasSavedToday(true);
      setSavedValue(valueToSubmit); // Фиксируем значение
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
  const recordedValue = hasSavedToday && savedValue !== null ? savedValue : currentValue;
  const isChanged = displayValue !== recordedValue;
  const showSavedState = !isChanged && recordedValue > 0;

  return (
    <div className={cn("w-full", className)}>
      {/* Прогресс бар */}
      <div className="space-y-1 h-12.5 text-shadow-sm">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground font-medium">Прогресс количества</span>
          <span
            className={cn(
              "font-medium",
              isOverdrive && "text-orange-500 font-bold",
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
                ? "#f97316"
                : isGoalReached
                  ? "#22c55e"
                  : "#3b82f6"
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
              "absolute inset-0 origin-left rounded-full shadow",
              isOverdrive
                ? "shadow-[0_0_8px_rgba(249,115,22,0.8)]"
                : isGoalReached
                  ? "shadow-[0_0_8px_rgba(34,197,94,0.8)]"
                  : "shadow-[0_0_8px_rgba(59,130,246,0.6)]",
            )}
          />
        </div>
        {isOverdrive && (
          <p className="text-[10px] text-orange-500 text-center font-bold tracking-wider uppercase mt-1">
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

          <input
            type="number"
            value={displayValue === 0 ? "" : displayValue}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              setLocalValue(isNaN(val) ? 0 : Math.max(0, val));
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.currentTarget.blur();
                const val = parseInt(e.currentTarget.value, 10);
                const finalValue = isNaN(val) ? 0 : Math.max(0, val);

                // Используем локальное обновление перед отправкой
                if (finalValue > 0) {
                  setLocalValue(finalValue);
                  handleSubmit(finalValue);
                }
              }
            }}
            disabled={isPending}
            className={cn(
              "text-3xl font-black w-24 text-center drop-shadow-sm font-mono tracking-tight bg-transparent border-none outline-none appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none rounded-lg focus:ring-2 focus:ring-primary/20 transition-all",
              isOverdrive && "text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]",
              isGoalReached && !isOverdrive && "text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]",
            )}
            style={{ MozAppearance: "textfield" }}
            placeholder="0"
          />

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
          whileTap={!isPending && displayValue > 0 && isChanged ? { scale: 0.97 } : {}}
          className="w-full"
        >
          <Button
            onClick={() => handleSubmit()}
            disabled={isPending || displayValue === 0 || !isChanged}
            className={cn(
              "w-full transition-all shadow-sm font-medium",
              showSavedState && "bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)] opacity-90",
              !showSavedState && isOverdrive && "bg-orange-600 hover:bg-orange-700 text-white shadow-[0_0_15px_rgba(234,88,12,0.3)]",
              !showSavedState && isGoalReached && !isOverdrive && "bg-green-500 hover:bg-green-600 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]",
              !showSavedState && !isGoalReached && displayValue > 0 && "bg-primary hover:bg-primary/90"
            )}
            size="lg"
          >
            <Check className="w-5 h-5 mr-2" />
            {showSavedState
              ? "Сохранено!"
              : recordedValue > 0
                ? (isOverdrive ? "Перезаписать Overdrive!" : "Перезаписать")
                : isOverdrive
                  ? "Сохранить Overdrive!"
                  : isGoalReached
                    ? "Сохранить успех!"
                    : "Сохранить прогресс"}
          </Button>
        </motion.div>

        {(hasSavedToday || currentValue > 0) ? (
          <p className="text-xs text-center text-green-500/80 font-medium flex items-center justify-center gap-1">
            <Check className="w-3 h-3" />
            Уже зафиксировано: {hasSavedToday && savedValue !== null ? savedValue : currentValue} / {targetValue}
          </p>
        ) : (
          <p className="text-xs text-center text-muted-foreground/70">
            Сегодня еще не фиксировалось
          </p>
        )}
      </div>
    </div>
  );
}
