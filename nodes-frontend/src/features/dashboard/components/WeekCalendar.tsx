import { format, addDays, subDays, startOfWeek, isSameDay, startOfDay } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { motion } from "motion/react";

interface WeekCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  className?: string;
}

export function WeekCalendar({ selectedDate, onSelectDate, className }: WeekCalendarProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(selectedDate, { weekStartsOn: 1 })
  );

  const days = Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));
  const today = startOfDay(new Date());

  const handlePrevWeek = () => setCurrentWeekStart(subDays(currentWeekStart, 7));
  const handleNextWeek = () => setCurrentWeekStart(addDays(currentWeekStart, 7));
  const handleJumpToToday = () => {
    onSelectDate(today);
    setCurrentWeekStart(startOfWeek(today, { weekStartsOn: 1 }));
  };

  return (
    <div className={cn("w-full space-y-4", className)}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold capitalize flex items-center gap-3">
          {format(currentWeekStart, "LLLL yyyy", { locale: ru })}
          {!isSameDay(selectedDate, today) && (
            <Button variant="ghost" size="sm" onClick={handleJumpToToday} className="text-xs h-7 text-muted-foreground hidden sm:flex">
              Вернуться к сегодня
            </Button>
          )}
        </h2>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevWeek} className="w-8 h-8 rounded-full bg-background/50 border-white/10">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextWeek} className="w-8 h-8 rounded-full bg-background/50 border-white/10">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, today);
          const isFuture = startOfDay(day) > today;

          return (
            <motion.button
              key={day.toISOString()}
              whileTap={!isFuture ? { scale: 0.95 } : {}}
              onClick={() => !isFuture && onSelectDate(day)}
              disabled={isFuture}
              className={cn(
                "relative flex flex-col items-center justify-center p-3 rounded-2xl border transition-colors duration-300 h-20",
                isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                  : "bg-background/50 border-white/5 hover:bg-muted/50 backdrop-blur-sm",
                isFuture && "opacity-40 cursor-not-allowed",
                isToday && !isSelected && "border-primary/50 text-primary"
              )}
            >
              <span className={cn("text-[10px] font-medium uppercase mb-1", isSelected ? "text-primary-foreground/80" : "text-muted-foreground")}>
                {format(day, "EEEEEE", { locale: ru })}
              </span>
              <span className="text-xl font-bold">
                {format(day, "d")}
              </span>

              {/* Индикатор активности */}
              {isToday && (
                <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-current opacity-50" />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
