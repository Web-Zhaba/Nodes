"use client";

import { motion } from "motion/react";
import type React from "react";
import { Fragment, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export interface ContributionData {
  count: number;
  date: string;
  level: number;
  stability?: number;
}

export interface ContributionGraphProps {
  className?: string;
  data?: ContributionData[];
  showLegend?: boolean;
  showTooltips?: boolean;
  year?: number;
}

const WEEKS_IN_YEAR = 53;
const DAYS_IN_WEEK = 7;
const JANUARY_MONTH = 0;
const DECEMBER_MONTH = 11;
const SUNDAY_DAY = 0;
const MIN_WEEKS_FOR_DECEMBER_HEADER = 2;
const TOOLTIP_OFFSET_X = 10;
const TOOLTIP_OFFSET_Y = 40;

const MONTHS = [
  "Янв",
  "Фев",
  "Мар",
  "Апр",
  "Май",
  "Июн",
  "Июл",
  "Авг",
  "Сен",
  "Окт",
  "Ноя",
  "Дек",
];

const DAYS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

// Contribution level colors
const CONTRIBUTION_COLORS = [
  "bg-muted/60",       // Level 0 - No contributions
  "bg-primary/30",     // Level 1
  "bg-primary/50",     // Level 2
  "bg-primary/75",     // Level 3
  "bg-primary",        // Level 4 - Max
];

const LEVEL_0 = 0;
const LEVEL_1 = 1;
const LEVEL_2 = 2;
const LEVEL_3 = 3;
const LEVEL_4 = 4;
const CONTRIBUTION_LEVELS = [LEVEL_0, LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4];
const DAY_1 = 1;
const DAY_31 = 31;

// Helper function to check if date is in valid range
const isDateInValidRange = (
  currentDate: Date,
  startDate: Date,
  endDate: Date,
  targetYear: number
) => {
  const isInRange = currentDate >= startDate && currentDate <= endDate;
  const isPreviousYearDecember =
    currentDate.getFullYear() === targetYear - 1 &&
    currentDate.getMonth() === DECEMBER_MONTH;
  const isNextYearJanuary =
    currentDate.getFullYear() === targetYear + 1 &&
    currentDate.getMonth() === JANUARY_MONTH;
  return isInRange || isPreviousYearDecember || isNextYearJanuary;
};

// Helper function to create day data
const createDayData = (
  currentDate: Date,
  contributionData: ContributionData[]
): ContributionData => {
  const dateString = currentDate.toISOString().split("T")[0];
  const existingData = contributionData.find((d) => d.date === dateString);
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  const isFuture = currentDate > now;
  return {
    date: dateString,
    count: isFuture ? -1 : (existingData?.count ?? LEVEL_0),
    level: isFuture ? -1 : (existingData?.level ?? LEVEL_0),
  };
};

// Helper function to check if month should be shown
interface MonthHeaderCheck {
  currentMonth: number;
  currentYear: number;
  startDateDay: number;
  targetYear: number;
  weekCount: number;
}
const shouldShowMonthHeader = ({
  currentYear,
  targetYear,
  currentMonth,
  startDateDay,
  weekCount,
}: MonthHeaderCheck) =>
  currentYear === targetYear ||
  (currentYear === targetYear - 1 &&
    currentMonth === DECEMBER_MONTH &&
    startDateDay !== SUNDAY_DAY &&
    weekCount >= MIN_WEEKS_FOR_DECEMBER_HEADER);

// Helper function to calculate month headers
const calculateMonthHeaders = (targetYear: number) => {
  const headers: { month: string; colspan: number; startWeek: number }[] = [];
  const startDate = new Date(targetYear, JANUARY_MONTH, DAY_1);
  const firstSunday = new Date(startDate);
  firstSunday.setDate(startDate.getDate() - startDate.getDay());

  let currentMonth = -1;
  let currentYear = -1;
  let monthStartWeek = 0;
  let weekCount = 0;

  for (let weekNumber = 0; weekNumber < WEEKS_IN_YEAR; weekNumber++) {
    const weekDate = new Date(firstSunday);
    weekDate.setDate(firstSunday.getDate() + weekNumber * DAYS_IN_WEEK);

    const monthKey = weekDate.getMonth();
    const yearKey = weekDate.getFullYear();

    if (monthKey !== currentMonth || yearKey !== currentYear) {
      if (
        currentMonth !== -1 &&
        shouldShowMonthHeader({
          currentYear,
          targetYear,
          currentMonth,
          startDateDay: startDate.getDay(),
          weekCount,
        })
      ) {
        headers.push({
          month: MONTHS[currentMonth],
          colspan: weekCount,
          startWeek: monthStartWeek,
        });
      }
      currentMonth = monthKey;
      currentYear = yearKey;
      monthStartWeek = weekNumber;
      weekCount = 1;
    } else {
      weekCount++;
    }
  }

  // Add the last month
  if (
    currentMonth !== -1 &&
    shouldShowMonthHeader({
      currentYear,
      targetYear,
      currentMonth,
      startDateDay: startDate.getDay(),
      weekCount,
    })
  ) {
    headers.push({
      month: MONTHS[currentMonth],
      colspan: weekCount,
      startWeek: monthStartWeek,
    });
  }

  return headers;
};

export function ContributionGraph({
  data = [],
  year = new Date().getFullYear(),
  className = "",
  showLegend = true,
  showTooltips = true,
}: ContributionGraphProps) {
  const [hoveredDay, setHoveredDay] = useState<ContributionData | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Generate all days for the year
  const yearData = useMemo(() => {
    const startDate = new Date(year, JANUARY_MONTH, DAY_1);
    const endDate = new Date(year, DECEMBER_MONTH, DAY_31);
    const days: ContributionData[] = [];

    const firstSunday = new Date(startDate);
    firstSunday.setDate(startDate.getDate() - startDate.getDay());

    for (let weekNum = 0; weekNum < WEEKS_IN_YEAR; weekNum++) {
      for (let day = 0; day < DAYS_IN_WEEK; day++) {
        const currentDate = new Date(firstSunday);
        currentDate.setDate(
          firstSunday.getDate() + weekNum * DAYS_IN_WEEK + day
        );

        if (isDateInValidRange(currentDate, startDate, endDate, year)) {
          days.push(createDayData(currentDate, data));
        } else {
          days.push({
            date: "",
            count: LEVEL_0,
            level: LEVEL_0,
          });
        }
      }
    }

    return days;
  }, [data, year]);

  // Calculate month headers with colspan
  const monthHeaders = useMemo(() => calculateMonthHeaders(year), [year]);

  const handleDayHover = (day: ContributionData, event: React.MouseEvent) => {
    if (showTooltips && day.date && day.level !== -1) {
      setHoveredDay(day);
      setTooltipPosition({ x: event.clientX, y: event.clientY });
    }
  };

  const handleDayLeave = () => {
    setHoveredDay(null);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) {
      return "";
    }
    const date = new Date(dateString);
    // "четверг, 23 апреля"
    const formatted = date.toLocaleDateString("ru-RU", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const getContributionText = (count: number) => {
    if (count === LEVEL_0) return "Нет активности";
    
    // Склонение слова "импульс"
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;
    
    if (lastDigit === 1 && lastTwoDigits !== 11) {
      return `${count} импульс`;
    }
    if ([2, 3, 4].includes(lastDigit) && ![12, 13, 14].includes(lastTwoDigits)) {
      return `${count} импульса`;
    }
    return `${count} импульсов`;
  };

  return (
    <div 
      className={cn("contribution-graph w-full", className)}
      style={{
        "--day-label-width": "clamp(18px, 4vw, 28px)",
        "--grid-gap": "clamp(1px, 0.5vw, 3px)",
      } as React.CSSProperties}
    >
      {/* Month headers — uses same CSS grid as the cells */}
      <div
        className="grid mb-1"
        style={{
          gridTemplateColumns: `var(--day-label-width) repeat(${WEEKS_IN_YEAR}, 1fr)`,
          gap: `var(--grid-gap)`,
        }}
      >
        {/* empty cell for day labels column */}
        <div />
        {(() => {
          // Build an array of 53 slots, each slot gets a month label or empty
          const slots: (string | null)[] = new Array(WEEKS_IN_YEAR).fill(null);
          for (const header of monthHeaders) {
            slots[header.startWeek] = header.month;
          }
          return slots.map((label, i) => (
            <div key={i} className="text-[7px] xs:text-[8px] sm:text-[11px] text-foreground/70 overflow-visible whitespace-nowrap">
              {label || ''}
            </div>
          ));
        })()}
      </div>

      {/* Main grid: 7 rows × (1 label col + 53 week cols) */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: `var(--day-label-width) repeat(${WEEKS_IN_YEAR}, 1fr)`,
          gap: `var(--grid-gap)`,
        }}
      >
        {Array.from({ length: DAYS_IN_WEEK }, (_, dayIndex) => (
          <Fragment key={`row-${dayIndex}`}>
            {/* Day label */}
            <div
              className="text-[7px] xs:text-[8px] sm:text-[11px] text-foreground/70 flex items-center shrink-0"
              style={{ width: "var(--day-label-width)" }}
            >
              {dayIndex % 2 === 0 ? DAYS[dayIndex] : ''}
            </div>

            {/* 53 cells for this day-of-week */}
            {Array.from({ length: WEEKS_IN_YEAR }, (_, weekIndex) => {
              const dayData = yearData[weekIndex * DAYS_IN_WEEK + dayIndex];

              if (!dayData?.date) {
                return (
                  <div key={`empty-${weekIndex}-${dayIndex}`} className="w-full" style={{ paddingBottom: '100%' }} />
                );
              }

              const isFuture = dayData.level === -1;
              const colorClass = isFuture
                ? CONTRIBUTION_COLORS[0]
                : CONTRIBUTION_COLORS[dayData.level];

              return (
                <div
                  key={dayData.date}
                  className="relative w-full"
                  style={{ paddingBottom: '100%' }}
                >
                  <div
                    className={`absolute inset-0 rounded-[3px] ${colorClass} ${
                      !isFuture
                        ? "cursor-pointer hover:ring-1 hover:ring-primary/50 hover:shadow-[0_0_8px_rgba(var(--primary),0.4)] transition-all duration-200"
                        : ""
                    }`}
                    onMouseEnter={(e) => handleDayHover(dayData, e)}
                    onMouseLeave={handleDayLeave}
                  />
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>

      {/* Tooltip */}
      {showTooltips && hoveredDay && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="pointer-events-none fixed z-50 rounded-xl border border-border/40 bg-background/95 backdrop-blur-xl px-4 py-3 text-foreground shadow-[0_20px_50px_rgba(0,0,0,0.3),0_0_20px_rgba(var(--primary),0.1)] min-w-[180px]"
          style={{
            left: tooltipPosition.x + TOOLTIP_OFFSET_X,
            top: tooltipPosition.y - TOOLTIP_OFFSET_Y - (hoveredDay.stability !== undefined ? 65 : 45),
          }}
        >
          <div className="flex flex-col gap-1.5">
            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.15em] opacity-50">
              {formatDate(hoveredDay.date)}
            </div>
            
            <div className="flex items-center justify-between gap-4 mt-0.5">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  hoveredDay.count > 0 ? "bg-primary shadow-[0_0_8px_var(--primary)]" : "bg-muted-foreground/30"
                }`} />
                <span className="font-semibold text-[14px] tracking-tight">
                  {getContributionText(hoveredDay.count)}
                </span>
              </div>
            </div>

            {hoveredDay.stability !== undefined && (
              <div className="mt-2 pt-2 border-t border-border/30 flex items-center justify-between gap-2">
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider opacity-60">Стабильность</span>
                <span className="text-[13px] font-bold text-primary">{Math.round(hoveredDay.stability)}%</span>
              </div>
            )}
          </div>
          
          {/* Subtle triangle indicator */}
          <div className="absolute -bottom-1.5 left-6 w-3 h-3 bg-background/95 border-r border-b border-border/40 rotate-45" />
        </motion.div>
      )}

      {/* Legend */}
      {showLegend && (
        <div className="mt-3 flex items-center justify-end gap-2 text-[11px] text-foreground/70">
          <span>Меньше</span>
          <div className="flex items-center gap-[3px]">
            {CONTRIBUTION_LEVELS.map((level) => (
              <div
                className={`h-[12px] w-[12px] rounded-[2px] ${CONTRIBUTION_COLORS[level]}`}
                key={level}
              />
            ))}
          </div>
          <span>Больше</span>
        </div>
      )}
    </div>
  );
}

export default ContributionGraph;
