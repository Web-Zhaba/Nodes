import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAnalyticsStore } from '@/store/useAnalyticsStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Палитра цветов для узлов, если у них нет своего цвета
const FALLBACK_COLORS = [
  '#a78bfa', '#34d399', '#60a5fa', '#f472b6', '#fbbf24',
  '#fb923c', '#a3e635', '#22d3ee', '#e879f9', '#f87171',
];

const PERIODS = [
  { label: '7д', days: 7 },
  { label: '30д', days: 30 },
  { label: '90д', days: 90 },
  { label: 'Год', days: 365 },
];

export function StabilityHeroChart() {
  const { focusEntity, setFocus, clearFocus, chartData, nodes, isLoading, selectedDays, setSelectedDays } = useAnalyticsStore();
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  if (isLoading && chartData.length === 0) {
    return (
      <div className="w-full border border-border/50 bg-background/50 backdrop-blur-sm rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-2 text-lg tracking-wide">Стабильность — загрузка...</h3>
        <div className="h-[280px] flex items-center justify-center text-muted-foreground animate-pulse">
          Получение данных с сервера...
        </div>
      </div>
    );
  }

  // Если нет данных — показываем пустой стейт
  const hasData = chartData.length > 0 && nodes.length > 0;

  // Обработчик клика по графику
  const handleChartClick = (e: any) => {
    // Кликнули в пустоту
    if (!e || !e.activePayload) {
      clearFocus();
    }
  };

  return (
    <div className="w-full border border-border/50 bg-background/50 backdrop-blur-sm rounded-xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h3 className="font-semibold text-lg tracking-wide">
          Стабильность {focusEntity ? `— ${focusEntity.type === 'node' ? 'Фокус на узле' : 'Ядро'}` : '— Общая'}
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
        <div className="flex flex-wrap gap-3 mb-4 text-sm text-muted-foreground">
          {nodes.map((node, i) => {
            const isFocused = focusEntity?.id === node.id;
            const isDimmed = focusEntity?.id ? !isFocused : (hoveredNodeId ? hoveredNodeId !== node.id : false);
            return (
              <div 
                key={node.id} 
                className={cn(
                  "flex items-center gap-1.5 cursor-pointer transition-opacity duration-300",
                  isDimmed ? "opacity-30" : "opacity-100 font-medium text-foreground"
                )}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                onClick={() => setFocus({ type: 'node', id: node.id })}
              >
                <span
                  className="block w-3 h-3 rounded-sm transition-transform hover:scale-110"
                  style={{ backgroundColor: node.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length] }}
                />
                {node.name}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ width: '100%', height: 280 }}>
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={chartData} 
              margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
              onClick={handleChartClick}
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
                    dot={{ 
                      r: isFocused ? 4 : 3, 
                      fill: color, 
                      fillOpacity: isDimmed ? 0.15 : 1, 
                      strokeOpacity: isDimmed ? 0.15 : 1 
                    }}
                    activeDot={{ 
                      r: 6, 
                      strokeWidth: 0,
                      fill: color,
                      onClick: () => setFocus({ type: 'node', id: node.id })
                    }}
                    style={{ transition: 'stroke-opacity 0.3s ease, stroke-width 0.3s ease' }}
                    connectNulls
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Нет данных за выбранный период. Начните записывать импульсы!
          </div>
        )}
      </div>
    </div>
  );
}
