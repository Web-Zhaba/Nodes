import { useMemo } from "react";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import { useTranslation } from "react-i18next";
import { ContributionGraph } from "@/components/ui/smoothui/contribution-graph";
import type { ContributionData } from "@/components/ui/smoothui/contribution-graph";
import { useResponsiveAnalytics } from "../hooks/useResponsiveAnalytics";

interface Impulse {
  completed_at?: string;
  value?: number;
  node_id?: string;
}

interface NodeHeatmapProps {
  impulses: Impulse[];
  nodeName?: string;
  nodeColor?: string;
  isLoading?: boolean;
  title?: string;
  limitWeeks?: number;
}

function buildHeatmapData(impulses: Impulse[], nodeColor?: string): ContributionData[] {
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
      console.warn("Heatmap: Invalid date format", imp.completed_at);
    }
  });

  const result: ContributionData[] = [];
  byDate.forEach((count, date) => {
    const level = count === 0 ? 0 : count < 2 ? 1 : count < 4 ? 2 : count < 7 ? 3 : 4;
    result.push({
      date,
      count,
      level,
      activeNodes: nodeColor ? [{ name: "activity", count, color: nodeColor }] : undefined,
    });
  });
  return result;
}

export function NodeHeatmap({
  impulses,
  nodeName,
  nodeColor,
  isLoading = false,
  title,
  limitWeeks: manualLimitWeeks,
}: NodeHeatmapProps) {
  const { t } = useTranslation();
  const { limitWeeks } = useResponsiveAnalytics({ manualLimitWeeks });

  const heatmapData = useMemo(
    () => buildHeatmapData(impulses, nodeColor),
    [impulses, nodeColor]
  );

  const displayTitle = title || t('analytics.heatmap.title', 'Pulse History');

  return (
    <section className="bg-background/40 backdrop-blur-xl border border-border/40 rounded-[2.5rem] p-4 sm:p-8 shadow-xl space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-[10px] sm:text-sm font-bold uppercase tracking-widest">{displayTitle}</h2>
        </div>
        {nodeName && (
          <span className="hidden xs:inline text-[10px] font-mono text-muted-foreground">{nodeName}</span>
        )}
      </div>

      {isLoading ? (
        <div className="h-32 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : (
        <ContributionGraph 
          data={heatmapData} 
          showLegend 
          showTooltips 
          limitWeeks={limitWeeks}
        />
      )}
    </section>
  );
}
