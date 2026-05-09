import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAnalyticsStore } from '@/store/useAnalyticsStore';
import { useProcessedAnalytics } from '@/features/analytics/hooks/useProcessedAnalytics';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

// Палитра цветов для узлов, если у них нет своего цвета
const FALLBACK_COLORS = [
  '#a78bfa', '#34d399', '#60a5fa', '#f472b6', '#fbbf24',
  '#fb923c', '#a3e635', '#22d3ee', '#e879f9', '#f87171',
];

export function StabilityHeroChart() {
  const { t } = useTranslation();
  const { focusEntity, setFocus, clearFocus, nodes, isLoading, selectedDays, setSelectedDays } = useAnalyticsStore();

  const PERIODS = [
    { label: t('analytics.periods.7d'), days: 7 },
    { label: t('analytics.periods.30d'), days: 30 },
    { label: t('analytics.periods.90d'), days: 90 },
    { label: t('analytics.periods.year'), days: 365 },
  ];
  const { chartData } = useProcessedAnalytics();
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  if (isLoading && chartData.length === 0) {
    return (
      <div className="w-full border border-border/50 bg-background/50 backdrop-blur-sm rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-48 bg-muted/50 rounded-md animate-pulse" />
          <div className="h-8 w-64 bg-muted/30 rounded-lg animate-pulse" />
        </div>
        <div className="flex gap-3 mb-6">
          <div className="h-4 w-24 bg-muted/40 rounded animate-pulse" />
          <div className="h-4 w-32 bg-muted/40 rounded animate-pulse" />
        </div>
        <div className="h-[280px] w-full flex flex-col justify-end gap-0 opacity-50">
          <div className="flex justify-between items-end h-full px-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
              <div 
                key={i} 
                className="w-[5%] bg-primary/10 rounded-t-sm animate-pulse" 
                style={{ 
                  height: `${20 + Math.sin(i) * 30 + 40}%`, 
                  animationDelay: `${i * 100}ms` 
                }} 
              />
            ))}
          </div>
          <div className="w-full h-px bg-border/30 mt-2" />
        </div>
      </div>
    );
  }

  // Если нет данных — показываем пустой стейт
  const hasData = chartData.length > 0 && nodes.length > 0;

  return (
    <div 
      className="w-full border border-border/50 bg-background/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-sm overflow-hidden"
      onClick={clearFocus}
    >
      <div 
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4"
        onClick={(e) => e.stopPropagation()} // Предотвращаем сброс фокуса при клике на хедер
      >
        <h3 className="font-semibold text-lg tracking-wide">
          {t('analytics.stability.title')} {focusEntity ? `— ${focusEntity.type === 'node' ? t('analytics.stability.focusNode') : t('analytics.stability.core')}` : `— ${t('analytics.stability.global')}`}
        </h3>

        <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg border border-border/20 self-start sm:self-center">
          {PERIODS.map((p) => (
            <Button
              key={p.days}
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 px-3 text-xs rounded-md transition-all",
                selectedDays === p.days 
                  ? "bg-background text-foreground shadow-sm font-medium" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setSelectedDays(p.days)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Legend with Hover/Click */}
      {nodes.length > 0 && (
        <div className="relative mb-4 group">
          <div 
            className="flex flex-nowrap sm:flex-wrap items-center gap-3 overflow-x-auto sm:overflow-x-visible pb-2 sm:pb-0 no-scrollbar"
            onClick={(e) => e.stopPropagation()} 
          >
            {nodes.map((node, i) => {
              const isFocused = focusEntity?.id === node.id;
              const isDimmed = focusEntity?.id ? !isFocused : (hoveredNodeId ? hoveredNodeId !== node.id : false);
              return (
                <div 
                  key={node.id} 
                  className={cn(
                    "flex items-center gap-1.5 cursor-pointer transition-all duration-300 shrink-0 whitespace-nowrap px-2 py-1 rounded-md",
                    isDimmed ? "opacity-30 scale-95" : "opacity-100 font-medium text-foreground bg-primary/5 border border-primary/10 shadow-sm"
                  )}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFocus({ type: 'node', id: node.id });
                  }}
                >
                  <span
                    className="block w-2.5 h-2.5 rounded-full ring-2 ring-background shadow-[0_0_8px_rgba(0,0,0,0.2)]"
                    style={{ backgroundColor: node.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length] }}
                  />
                  <span className="text-xs sm:text-sm">{node.name}</span>
                </div>
              );
            })}
          </div>
          {/* Subtle gradient for scroll indication on mobile */}
          <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-background/50 to-transparent pointer-events-none sm:hidden" />
        </div>
      )}

      <div className="w-full h-[240px] sm:h-[320px]">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={chartData} 
              margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
              // Удаляем onClick отсюда, так как родительский div перехватывает клик по пустому пространству
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.85)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 8,
                  fontSize: 13,
                }}
                labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
              />
              {nodes.map((node, i) => {
                const color = node.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length];
                const isFocused = focusEntity?.id === node.id;
                const isDimmed = focusEntity?.id ? !isFocused : (hoveredNodeId && hoveredNodeId !== node.id);
                
                return (
                  <Line
                    key={node.id}
                    type="monotone"
                    dataKey={node.id}
                    name={node.name}
                    stroke={color}
                    strokeWidth={isFocused || (hoveredNodeId === node.id) ? 3 : 2}
                    strokeOpacity={isDimmed ? 0.15 : 1}
                    dot={false}
                    activeDot={{ 
                      r: 6, 
                      strokeWidth: 0,
                      fill: color,
                      onClick: () => {
                        // Recharts event handling
                        setFocus({ type: 'node', id: node.id });
                      }
                    }}
                    style={{ transition: 'stroke-opacity 0.3s ease, stroke-width 0.3s ease', cursor: 'pointer' }}
                    connectNulls
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-center p-4 text-muted-foreground">
            {t('analytics.stability.noData')}
          </div>
        )}
      </div>
    </div>
  );
}
