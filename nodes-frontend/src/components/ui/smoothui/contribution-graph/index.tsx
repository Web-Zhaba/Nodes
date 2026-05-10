"use client";

import { motion, AnimatePresence } from "motion/react";
import type React from "react";
import { Fragment, useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export interface ContributionData {
  count: number;
  date: string;
  level: number;
  stability?: number;
  activeNodes?: Array<{ name: string; count: number; color?: string }>;
}

export interface ContributionGraphProps {
  className?: string;
  data?: ContributionData[];
  showLegend?: boolean;
  showTooltips?: boolean;
  year?: number;
  limitWeeks?: number; // New prop to show only last N weeks
}

const WEEKS_IN_YEAR = 53;
const DAYS_IN_WEEK = 7;
const JANUARY_MONTH = 0;
const DECEMBER_MONTH = 11;
const SUNDAY_DAY = 0;
const MIN_WEEKS_FOR_DECEMBER_HEADER = 2;


// Constants moved into component or handled dynamically

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
    stability: existingData?.stability,
    activeNodes: existingData?.activeNodes,
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
const calculateMonthHeaders = (targetYear: number, monthsArray: string[]) => {
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
          month: monthsArray[currentMonth],
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
      month: monthsArray[currentMonth],
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
  limitWeeks,
}: ContributionGraphProps) {
  const { t, i18n } = useTranslation();

  const MONTHS = useMemo(() => [
    t('common.months.jan', 'Янв'),
    t('common.months.feb', 'Фев'),
    t('common.months.mar', 'Мар'),
    t('common.months.apr', 'Апр'),
    t('common.months.may', 'Май'),
    t('common.months.jun', 'Июн'),
    t('common.months.jul', 'Июл'),
    t('common.months.aug', 'Авг'),
    t('common.months.sep', 'Сен'),
    t('common.months.oct', 'Окт'),
    t('common.months.nov', 'Ноя'),
    t('common.months.dec', 'Дек'),
  ], [t]);

  const DAYS = useMemo(() => [
    t('common.days.sun', 'Вс'),
    t('common.days.mon', 'Пн'),
    t('common.days.tue', 'Вт'),
    t('common.days.wed', 'Ср'),
    t('common.days.thu', 'Чт'),
    t('common.days.fri', 'Пт'),
    t('common.days.sat', 'Сб')
  ], [t]);

  const [hoveredDay, setHoveredDay] = useState<ContributionData | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

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
  const monthHeaders = useMemo(() => calculateMonthHeaders(year, MONTHS), [year, MONTHS]);

  // Calculate effective week range
  // Calculate current week index for smarter slicing
  const currentWeek = useMemo(() => {
    const now = new Date();
    if (now.getFullYear() !== year) return WEEKS_IN_YEAR - 1;
    // Calculate weeks from the first Sunday of the year (start of grid)
    const startDate = new Date(year, JANUARY_MONTH, DAY_1);
    const firstSunday = new Date(startDate);
    firstSunday.setDate(startDate.getDate() - startDate.getDay());
    const diff = now.getTime() - firstSunday.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
  }, [year]);

  const displayedWeeks = limitWeeks ? Math.min(limitWeeks, WEEKS_IN_YEAR) : WEEKS_IN_YEAR;
  
  // If limitWeeks is used, show weeks leading up to today (if current year) or end of year
  const startWeek = limitWeeks 
    ? Math.max(0, Math.min(currentWeek + 1, WEEKS_IN_YEAR) - displayedWeeks)
    : 0;

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
    const formatted = date.toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : 'en-US', {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const getContributionText = (count: number) => {
    if (count === LEVEL_0) return t('analytics.heatmap.noActivity');
    // i18next pluralization works with count
    return t('analytics.heatmap.pulses', { count });
  };

  return (
    <div 
      className={cn("contribution-graph w-full overflow-hidden", className)}
      style={{
        "--day-label-width": displayedWeeks > 30 ? "clamp(18px, 4vw, 28px)" : "24px",
        "--grid-gap": "clamp(1px, 0.5vw, 3px)",
      } as React.CSSProperties}
    >
      <div className="overflow-x-auto pb-2 custom-scrollbar">
        <div className="min-w-[300px]">
          {/* Month headers — uses same CSS grid as the cells */}
          <div
            className="grid mb-1.5"
            style={{
              gridTemplateColumns: `var(--day-label-width) repeat(${displayedWeeks}, 1fr)`,
              gap: `var(--grid-gap)`,
            }}
          >
            {/* empty cell for day labels column */}
            <div />
            {(() => {
              // Build an array of slots for displayed weeks
              const slots: (string | null)[] = new Array(displayedWeeks).fill(null);
              for (const header of monthHeaders) {
                const relativeWeek = header.startWeek - startWeek;
                if (relativeWeek >= 0 && relativeWeek < displayedWeeks) {
                  slots[relativeWeek] = header.month;
                }
              }
              return slots.map((label, i) => (
                <div key={i} className="text-[9px] sm:text-[11px] text-foreground/50 font-medium overflow-visible whitespace-nowrap">
                  {label || ''}
                </div>
              ));
            })()}
          </div>

          {/* Main grid: 7 rows × (1 label col + displayed week cols) */}
          <div
            className="grid"
            style={{
              gridTemplateColumns: `var(--day-label-width) repeat(${displayedWeeks}, 1fr)`,
              gap: `var(--grid-gap)`,
            }}
          >
            {Array.from({ length: DAYS_IN_WEEK }, (_, dayIndex) => (
              <Fragment key={`row-${dayIndex}`}>
                {/* Day label */}
                <div
                  className="text-[9px] sm:text-[11px] text-foreground/40 font-medium flex items-center shrink-0"
                  style={{ width: "var(--day-label-width)" }}
                >
                  {dayIndex % 2 === 0 ? DAYS[dayIndex] : ''}
                </div>

                {/* Sliced cells for this day-of-week */}
                {Array.from({ length: displayedWeeks }, (_, weekIdxInSlice) => {
                  const weekIndex = startWeek + weekIdxInSlice;
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
                      <motion.div
                        initial={false}
                        animate={{
                          scale: hoveredDay?.date === dayData.date ? 1.15 : 1,
                          zIndex: hoveredDay?.date === dayData.date ? 10 : 1,
                        }}
                        className={cn(
                          "absolute inset-0 rounded-[2px] sm:rounded-[3px] transition-colors duration-200",
                          colorClass,
                          !isFuture && "cursor-pointer",
                          dayData.date === new Date().toISOString().split('T')[0] && "ring-1 ring-primary/50 shadow-[0_0_8px_rgba(var(--primary),0.3)]"
                        )}
                        onMouseEnter={(e) => handleDayHover(dayData, e)}
                        onMouseLeave={handleDayLeave}
                      />
                      {dayData.date === new Date().toISOString().split('T')[0] && (
                        <motion.div
                          animate={{ opacity: [0.2, 0.5, 0.2] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute inset-0 rounded-[2px] sm:rounded-[3px] bg-primary/20 blur-[2px]"
                        />
                      )}
                      {hoveredDay?.date === dayData.date && !isFuture && (
                        <motion.div
                          layoutId="hover-glow"
                          className="absolute inset-0 rounded-[3px] bg-primary/20 blur-[4px] -z-10"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        />
                      )}
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip Portal */}
      {mounted && createPortal(
        <AnimatePresence>
          {showTooltips && hoveredDay && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.98 }}
              transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
              className="pointer-events-none fixed z-[9999] rounded-xl border border-white/10 bg-black/80 backdrop-blur-xl px-4 py-3 text-white shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_20px_rgba(var(--primary),0.1)] min-w-[200px]"
              style={{
                left: tooltipPosition.x,
                top: tooltipPosition.y,
                transform: 'translate(-50%, -115%)', // Center horizontally and place above
              }}
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5 mb-0.5">
                  <span className="text-[10px] text-white/50 font-bold uppercase tracking-[0.1em]">
                    {formatDate(hoveredDay.date)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      hoveredDay.count > 0 
                        ? "bg-primary shadow-[0_0_10px_var(--primary)]" 
                        : "bg-white/20"
                    )} />
                    <span className="font-semibold text-[14px] tracking-tight text-white">
                      {getContributionText(hoveredDay.count)}
                    </span>
                  </div>
                </div>

                {hoveredDay.stability !== undefined && (
                  <div className="mt-1 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-white/40 font-medium uppercase tracking-wider">{t('analytics.stability.title')}</span>
                      <span className="text-[12px] font-bold text-primary">{Math.round(hoveredDay.stability)}%</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${hoveredDay.stability}%` }}
                        className="h-full bg-primary shadow-[0_0_8px_var(--primary)]"
                      />
                    </div>
                  </div>
                )}

                {hoveredDay.activeNodes && hoveredDay.activeNodes.length > 0 && (
                  <div className="mt-1 pt-2 border-t border-white/10 flex flex-col gap-1.5 max-h-[150px] overflow-y-auto custom-scrollbar pr-1">
                    {hoveredDay.activeNodes.map((node, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-3 text-[11px]">
                        <div className="flex items-center gap-2 min-w-0">
                          <div 
                            className="w-1.5 h-1.5 rounded-full shrink-0" 
                            style={{ backgroundColor: node.color || 'rgb(var(--primary))' }}
                          />
                          <span className="text-white/80 truncate font-medium">{node.name}</span>
                        </div>
                        {node.count > 1 && (
                          <span className="text-white/40 tabular-nums shrink-0 font-mono text-[10px]">
                            {node.count}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Premium Glow effect behind tooltip */}
              <div className="absolute inset-0 -z-10 bg-primary/5 rounded-xl blur-xl" />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Legend */}
      {showLegend && (
        <div className="mt-4 flex items-center justify-end gap-3 text-[10px] sm:text-[11px] text-foreground/50 font-medium">
          <span>{t('analytics.heatmap.less')}</span>
          <div className="flex items-center gap-[3px]">
            {CONTRIBUTION_LEVELS.map((level) => (
              <div
                className={`h-[10px] w-[10px] sm:h-[12px] sm:w-[12px] rounded-[2px] ${CONTRIBUTION_COLORS[level]}`}
                key={level}
              />
            ))}
          </div>
          <span>{t('analytics.heatmap.more')}</span>
        </div>
      )}
    </div>
  );
}

export default ContributionGraph;
