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
  onImpulse,
  className,
}: DurationControlProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0); // Всегда 0 в начале сессии
  const [isPending, setIsPending] = useState(false);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [manualMinutes, setManualMinutes] = useState("");
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
  const handleStop = async (overrideElapsed?: number | any) => {
    handlePause();

    const finalElapsed = typeof overrideElapsed === "number" ? overrideElapsed : elapsed;

    if (finalElapsed < 10) {
      toast.warning("Слишком мало времени", {
        description: "Минимум 10 секунд для записи",
      });
      setElapsed(0); // Обнуляем
      pausedElapsedRef.current = 0;
      return;
    }

    setIsPending(true);

    try {
      await onImpulse(finalElapsed);
      const totalElapsed = elapsedToday + finalElapsed;

      const newIsOverdrive = totalElapsed > targetValue;

      toast.success(newIsOverdrive ? "Перевыполнение!" : "Время записано!", {
        description: newIsOverdrive
          ? `${formatTime(totalElapsed - targetValue)} сверх цели!`
          : `${formatTime(finalElapsed)} — отличный результат!`,
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

  // Сброс сохраненного времени
  const handleReset = async () => {
    if (isPending) return;

    // Если таймер бежит, ставим на паузу
    handlePause();

    // Предупреждение/Подтверждение можно добавить, но пока просто сбросим
    setIsPending(true);

    try {
      await onImpulse(-1); // -1 магическое значение для удаления импульсов

      toast.success("Прогресс сброшен", {
        description: "Сохраненное время за сегодня удалено",
      });

      setElapsed(0);
      pausedElapsedRef.current = 0;
      setSavedElapsed(0);
      setHasSavedToday(true); // Переопределяем значение новым (нулем), чтобы сразу обновить UI
    } catch (error) {
      toast.error("Ошибка", {
        description: "Не удалось сбросить время",
      });
    } finally {
      setIsPending(false);
    }
  };

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
              isOverdrive && "text-orange-500 font-bold",
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
            +{formatTime(currentTotalElapsed - targetValue)} OVERDRIVE
          </p>
        )}
      </div>

      {/* Таймер (крупно) — фиксированная высота */}
      <div className="text-center py-4 h-[88px] flex-shrink-0 flex flex-col items-center justify-center">
        {!isEditingTime ? (
          <span
            onClick={() => {
              if (!isRunning) {
                setIsEditingTime(true);
                setManualMinutes(Math.floor(elapsed / 60).toString());
              }
            }}
            title={!isRunning ? "Кликните, чтобы ввести минуты вручную" : ""}
            className={cn(
              "text-4xl font-mono font-black tracking-tight drop-shadow-sm transition-colors",
              !isRunning && "cursor-pointer hover:opacity-80 transition-opacity",
              isRunning && "text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]",
              isOverdrive && "text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]",
              isGoalReached && !isOverdrive && "text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]",
            )}
          >
            {formatTime(elapsed)}
          </span>
        ) : (
          <div className="flex items-center justify-center gap-1.5 mt-[-4px]">
            <input
              type="number"
              autoFocus
              value={manualMinutes}
              onChange={(e) => setManualMinutes(e.target.value)}
              onBlur={() => {
                const val = parseInt(manualMinutes, 10);
                if (!isNaN(val) && val >= 0) {
                  setElapsed(val * 60);
                  pausedElapsedRef.current = val * 60;
                }
                setIsEditingTime(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur();
                  const val = parseInt(e.currentTarget.value, 10);
                  if (!isNaN(val) && val >= 0) {
                    handleStop(val * 60);
                  }
                }
              }}
              className="w-20 bg-transparent text-center text-4xl font-mono font-black tracking-tight border-b-2 border-primary/40 outline-none focus:border-primary transition-colors appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              style={{ MozAppearance: "textfield" }}
              placeholder="0"
            />
            <span className="text-sm font-medium text-muted-foreground pb-[-8px]">мин</span>
          </div>
        )}
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
            <motion.div whileTap={!isPending ? { scale: 0.97 } : {}} className="flex-1">
              <Button
                onClick={handleStart}
                disabled={isPending}
                className={cn(
                  "w-full transition-all shadow-sm font-medium",
                  "bg-primary hover:bg-primary/90"
                )}
                size="lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Старт
              </Button>
            </motion.div>
          ) : (
            <>
              <motion.div whileTap={{ scale: 0.97 }} className="flex-2 justify-center">
                <Button
                  onClick={handlePause}
                  variant="outline"
                  className="w-30 h-11 bg-background/50 border-white/10 shadow-sm"
                  size="lg"
                >
                  <Pause className="w-5 h-5 mr-1" />
                  Пауза
                </Button>
              </motion.div>
              <motion.div whileTap={!isPending ? { scale: 0.97 } : {}} className="flex-1">
                <Button
                  onClick={() => handleStop()}
                  disabled={isPending}
                  className={cn(
                    "w-30 transition-all shadow-sm font-medium",
                    isOverdrive && "bg-orange-600 hover:bg-orange-700 text-white shadow-[0_0_15px_rgba(234,88,12,0.3)]",
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

        {currentTotalElapsed > 0 ? (
          <div className="flex flex-row items-center justify-center gap-1">
            <p className="text-xs text-center text-green-500/80 font-medium flex items-center justify-center gap-1">
              <Timer className="w-3 h-3" />
              Уже зафиксировано: {formatTime(hasSavedToday && savedElapsed !== null ? savedElapsed : elapsedToday)}
            </p>
            <Button
              variant="link"
              onClick={handleReset}
              disabled={isPending || isRunning}
              className="h-auto p-0 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-red-500 transition-colors"
            >
              Сбросить
            </Button>
          </div>
        ) : (
          <p className="text-xs text-center text-muted-foreground/70">
            Сегодня еще не фиксировалось
          </p>
        )}
      </div>
    </div>
  );
}
