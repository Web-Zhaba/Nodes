import { useAnalyticsStore } from '../../../store/useAnalyticsStore';
import { useProcessedAnalytics } from '@/features/analytics/hooks/useProcessedAnalytics';
import { ContributionGraph } from '../../../components/ui/smoothui/contribution-graph';
import { useTranslation } from 'react-i18next';

export function PulseHeatmap() {
  const { t } = useTranslation();
  const { focusEntity, isLoading } = useAnalyticsStore();
  const { heatmapData } = useProcessedAnalytics();

  if (isLoading && heatmapData.length === 0) {
    return (
      <div className="w-full border border-border/50 bg-background/50 backdrop-blur-sm rounded-xl p-6 shadow-sm">
        <div className="h-6 w-48 bg-muted/50 rounded-md animate-pulse mb-6" />
        <div className="flex gap-2">
          {/* Day labels column */}
          <div className="flex flex-col justify-between py-1 pr-2 opacity-30 text-[11px]">
            <div /><div>{t('common.days.mon', 'Пн')}</div><div /><div>{t('common.days.wed', 'Ср')}</div><div /><div>{t('common.days.fri', 'Пт')}</div><div />
          </div>
          {/* Grid skeleton: One div instead of 371, using CSS pattern */}
          <div className="flex-1 min-h-[110px] bg-muted/10 rounded-md animate-pulse overflow-hidden relative">
            <div 
              className="absolute inset-0 opacity-20" 
              style={{
                backgroundImage: `
                  linear-gradient(to right, currentColor 1px, transparent 1px),
                  linear-gradient(to bottom, currentColor 1px, transparent 1px)
                `,
                backgroundSize: 'calc(100% / 53) calc(100% / 7)'
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full border border-border/50 bg-background/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg tracking-wide">
          {t('analytics.activity.title')} — {focusEntity ? `${focusEntity.type === 'node' ? t('analytics.stability.focusNode') : t('analytics.stability.core')}` : t('analytics.stability.global')}
        </h3>
      </div>
      
      <div className="w-full">
        <ContributionGraph data={heatmapData} />
      </div>
    </div>
  );
}
