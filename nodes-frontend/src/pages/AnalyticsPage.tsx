import { useEffect } from 'react';
import { useAnalyticsStore } from '../store/useAnalyticsStore';
import { StabilityHeroChart } from '../features/analytics/components/StabilityHeroChart';
import { PulseHeatmap } from '../features/analytics/components/PulseHeatmap';

import { GlobalControlBar } from '../features/analytics/components/GlobalControlBar';

export default function AnalyticsPage() {
    const { fetchData } = useAnalyticsStore();

    // Загружаем данные при первом монтировании
    useEffect(() => {
        fetchData(365);
    }, [fetchData]);

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
