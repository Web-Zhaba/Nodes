/**
 * NodeActivityChart — переиспользуемый area-chart активности импульсов.
 * Принимает сырые impulses через props, без зависимости от Zustand-стора.
 * Используется на PublicNodePage и может быть использован в AnalyticsPage.
 */
import { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Loader2, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useResponsiveAnalytics } from "../hooks/useResponsiveAnalytics";

interface Impulse {
  completed_at?: string;
  value?: number;
}

interface NodeActivityChartProps {
  impulses: Impulse[];
  color?: string;
  isLoading?: boolean;
  /** Количество последних дней */
  days?: number;
  title?: string;
}

export function NodeActivityChart({
  impulses,
  color = "#6366f1",
  isLoading = false,
  days: manualDays = 30,
  title,
}: NodeActivityChartProps) {
  const { t, i18n } = useTranslation();
  const { chartHeight, chartDays } = useResponsiveAnalytics({ manualDays });
  
  const chartData = useMemo(() => {
    const byDate = new Map<string, number>();
    impulses.forEach((imp) => {
      if (!imp.completed_at) return;
      try {
        // Robust date parsing without timezone shift
        const d = typeof imp.completed_at === 'string' 
          ? imp.completed_at.split("T")[0] 
          : new Date(imp.completed_at).toISOString().split("T")[0];
          
        if (d) byDate.set(d, (byDate.get(d) ?? 0) + (imp.value || 1));
      } catch (e) {
        console.warn("ActivityChart: Invalid date format", imp.completed_at);
      }
    });

    const result: { date: string; displayDate: string; value: number }[] = [];
    for (let i = chartDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      result.push({
        date: key,
        displayDate: d.toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : 'en-US', { day: "numeric", month: "short" }),
        value: byDate.get(key) ?? 0,
      });
    }
    return result;
  }, [impulses, chartDays, i18n.language]);

  const displayTitle = title || t('analytics.activity.title', 'Пульс активности');

  return (
    <section className="bg-background/40 backdrop-blur-xl border border-border/40 rounded-[2.5rem] p-4 sm:p-8 shadow-xl space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-[10px] sm:text-sm font-bold uppercase tracking-widest">{displayTitle}</h2>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground opacity-60">
          {t('analytics.periods.lastDays', 'Last {{count}} days', { count: chartDays })}
        </span>
      </div>

      <div style={{ height: chartHeight }} className="w-full">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="displayDate"
                tick={{ fontSize: 9, fill: "rgba(255,255,255,0.4)" }}
                tickLine={false}
                axisLine={false}
                interval={Math.floor(chartDays / 4)}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  background: "rgba(0,0,0,0.8)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "1rem",
                  fontSize: "12px",
                  backdropFilter: "blur(12px)",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
                }}
                itemStyle={{ color, fontWeight: "bold" }}
                labelStyle={{ color: "rgba(255,255,255,0.5)", marginBottom: "4px", fontSize: "10px", fontWeight: "bold", textTransform: "uppercase" }}
              />
              <Area
                type="monotone"
                dataKey="value"
                name={t('nodes.pulse', 'Pulse')}
                stroke={color}
                strokeWidth={3}
                fill={`url(#grad-${color.replace("#", "")})`}
                dot={{ r: 3, fill: color, strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
