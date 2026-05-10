import { useState, useEffect, useMemo } from "react";

interface ResponsiveAnalyticsOptions {
  manualLimitWeeks?: number;
  manualDays?: number;
}

/**
 * useResponsiveAnalytics — хук для централизованного управления размерами и масштабами
 * компонентов аналитики (тепловых карт и графиков) в зависимости от экрана.
 */
export function useResponsiveAnalytics(options: ResponsiveAnalyticsOptions = {}) {
  const { manualLimitWeeks, manualDays } = options;

  // 1. Расчет количества недель для тепловой карты (limitWeeks)
  const getResponsiveWeeks = () => {
    if (typeof window === 'undefined') return 18;
    const width = window.innerWidth;
    if (width < 480) return 10;
    if (width < 640) return 14;
    if (width < 1024) return 24;
    return 32;
  };

  // 2. Расчет высоты графика
  const getResponsiveHeight = () => {
    if (typeof window === 'undefined') return 200;
    return window.innerWidth < 640 ? 192 : 256; // h-48 vs h-64
  };

  const [limitWeeks, setLimitWeeks] = useState(manualLimitWeeks || getResponsiveWeeks());
  const [chartHeight, setChartHeight] = useState(getResponsiveHeight());

  useEffect(() => {
    const handleResize = () => {
      if (!manualLimitWeeks) {
        setLimitWeeks(getResponsiveWeeks());
      }
      setChartHeight(getResponsiveHeight());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [manualLimitWeeks]);

  // Если переданы мануальные дни для графика активности
  const chartDays = useMemo(() => manualDays || 30, [manualDays]);

  return {
    limitWeeks,
    chartHeight,
    chartDays,
    isMobile: typeof window !== 'undefined' && window.innerWidth < 768
  };
}
