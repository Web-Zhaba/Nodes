import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Play, Pause, Check, Timer } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";
import type { Node } from "@/types";

interface DurationControlProps {
  node: Node;
  elapsedToday: number; // секунд
  isCompletedToday: boolean;
  onImpulse: (value: number) => Promise<void>;
  className?: string;
}

/**
 * Контрол для Duration узлов (таймер)
 */
export function DurationControl({
  node,
  elapsedToday,
  isCompletedToday,
  onImpulse,
  className,
}: DurationControlProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0); // Всегда 0 в начале сессии
  const [isPending, setIsPending] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedElapsedRef = useRef<number>(0); // Сохраняем значение при паузе

  const targetValue = (node.target_value || 30) * 60; // Конвертируем минуты в секунды

  // Форматирование времени (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Запуск таймера
  const handleStart = () => {
    if (intervalRef.current) return;

    setIsRunning(true);
    startTimeRef.current = Date.now();

    intervalRef.current = window.setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    toast.info("Таймер запущен", {
      description: `Цель: ${Math.floor(targetValue / 60)} мин`,
    });
  };

  // Пауза таймера (сохраняем значение)
  const handlePause = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    // Сохраняем текущее значение перед паузой
    pausedElapsedRef.current = elapsed;
    setIsRunning(false);
  };

  // Остановка и сохранение
  const handleStop = async () => {
    handlePause();

    if (elapsed < 10) {
      toast.warning("Слишком мало времени", {
        description: "Минимум 10 секунд для записи",
      });
      setElapsed(0); // Обнуляем
      pausedElapsedRef.current = 0;
      return;
    }

    setIsPending(true);

    try {
      await onImpulse(elapsed);
      const totalElapsed = elapsedToday + elapsed;

      const newIsOverdrive = totalElapsed > targetValue;

      toast.success(newIsOverdrive ? "Перевыполнение!" : "Время записано!", {
        description: newIsOverdrive
          ? `${formatTime(totalElapsed - targetValue)} сверх цели!`
          : `${formatTime(elapsed)} — отличный результат!`,
      });

      setElapsed(0); // Сброс визуального таймера до нуля
      pausedElapsedRef.current = 0;
      setSavedElapsed(totalElapsed);
      setHasSavedToday(true);

    } catch (error) {
      toast.error("Ошибка", {
        description: "Не удалось сохранить время",
      });
      setElapsed(0); // В случае ошибки также сбрасываем текущую сессию
      pausedElapsedRef.current = 0;
    } finally {
      setIsPending(false);
    }
  };

  // Местный стейт для успешного сохранения (если БД не успела обновить props)
  const [hasSavedToday, setHasSavedToday] = useState(false);
  const [savedElapsed, setSavedElapsed] = useState<number | null>(null);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Восстанавливаем значение после паузы при старте
  useEffect(() => {
    if (isRunning && pausedElapsedRef.current > 0) {
      setElapsed(pausedElapsedRef.current);
      pausedElapsedRef.current = 0; // Сбрасываем после восстановления
    }
  }, [isRunning]);

  // Значение, которое мы сейчас отображаем как "прогресс за день"
  const currentTotalElapsed = hasSavedToday && savedElapsed !== null ? savedElapsed : elapsedToday + (isRunning || pausedElapsedRef.current > 0 ? elapsed : 0);

  const isGoalReached = currentTotalElapsed >= targetValue;
  const isOverdrive = currentTotalElapsed > targetValue; // Перевыполнение цели
  const progress = Math.min((currentTotalElapsed / targetValue) * 100, 100);

  return (
    <div className={cn("w-full", className)}>
      {/* Прогресс бар */}
      <div className="space-y-1 text-shadow-sm">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground font-medium">Прогресс времени</span>
          <span
            className={cn(
              "font-medium",
              isOverdrive && "text-purple-500 font-semibold",
              isGoalReached && !isOverdrive && "text-green-500",
              !isGoalReached && "text-blue-500",
            )}
          >
            {formatTime(currentTotalElapsed)} / {formatTime(targetValue)}
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
            +{formatTime(currentTotalElapsed - targetValue)} OVERDRIVE
          </p>
        )}
      </div>

      {/* Таймер (крупно) — фиксированная высота */}
      <div className="text-center py-4 h-[88px] flex-shrink-0">
        <span
          className={cn(
            "text-4xl font-mono font-black tracking-tight drop-shadow-sm transition-colors",
            isRunning && "text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]",
            isOverdrive && "text-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]",
            isGoalReached && !isOverdrive && "text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]",
          )}
        >
          {formatTime(elapsed)}
        </span>
        {isRunning && (
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(239,68,68,0.8)]" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider text-[10px]">Идет запись</span>
          </div>
        )}
      </div>

      {/* Кнопки управления */}
      <div className="space-y-3 mt-auto">
        <div className="flex gap-3">
          {!isRunning ? (
            <motion.div whileTap={!isPending && !isCompletedToday ? { scale: 0.97 } : {}} className="flex-1">
              <Button
                onClick={handleStart}
                disabled={isPending || isCompletedToday}
                className={cn(
                  "w-full transition-all shadow-sm font-medium",
                  !isCompletedToday && "bg-primary hover:bg-primary/90"
                )}
                size="lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Старт
              </Button>
            </motion.div>
          ) : (
            <>
              <motion.div whileTap={{ scale: 0.97 }} className="flex-1">
                <Button
                  onClick={handlePause}
                  variant="outline"
                  className="w-full h-11 bg-background/50 border-white/10 shadow-sm"
                  size="lg"
                >
                  <Pause className="w-5 h-5 mr-1" />
                  Пауза
                </Button>
              </motion.div>
              <motion.div whileTap={!isPending ? { scale: 0.97 } : {}} className="flex-1">
                <Button
                  onClick={handleStop}
                  disabled={isPending}
                  className={cn(
                    "w-full transition-all shadow-sm font-medium",
                    isOverdrive && "bg-purple-600 hover:bg-purple-700 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)]",
                    isGoalReached &&
                    !isOverdrive &&
                    "bg-green-500 hover:bg-green-600 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]",
                    !isGoalReached && "bg-primary hover:bg-primary/90"
                  )}
                  size="lg"
                >
                  <Check className="w-5 h-5 mr-1" />
                  {isOverdrive ? "Overdrive!" : "Стоп"}
                </Button>
              </motion.div>
            </>
          )}
        </div>

        {(isCompletedToday || hasSavedToday) ? (
          <p className="text-xs text-center text-green-500/80 font-medium flex items-center justify-center gap-1">
            <Timer className="w-3 h-3" />
            Сегодня уже выполнено на {formatTime(hasSavedToday && savedElapsed !== null ? savedElapsed : elapsedToday)}
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
