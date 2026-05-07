import { useEffect } from 'react';
import { useAnalyticsStore } from '../store/useAnalyticsStore';
import { StabilityHeroChart } from '../features/analytics/components/StabilityHeroChart';
import { PulseHeatmap } from '../features/analytics/components/PulseHeatmap';
import { GlobalControlBar } from '../features/analytics/components/GlobalControlBar';

export default function AnalyticsPage() {
    // Используем getState() напрямую, чтобы не создавать подписку на fetchData
    // и не вызывать лишние ререндеры самой страницы
    useEffect(() => {
        useAnalyticsStore.getState().fetchData(365);
    }, []); // Пустой массив — вызываем только при монтировании

    return (
        <div className="p-4 sm:p-6 mb-20">
            <GlobalControlBar />
            <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
                <div className="col-span-1 lg:col-span-2">
                  <StabilityHeroChart />
                </div>
                <div className="col-span-1 lg:col-span-2">
                  <PulseHeatmap />
                </div>
            </div>
        </div>
    );
}
