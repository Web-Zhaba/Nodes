import { useMemo, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNodesQuery } from '@/features/nodes/hooks/useNodesQuery';
import { useAnalyticsStore } from '@/store/useAnalyticsStore';
import { GlobalControlBar } from '@/features/analytics/components/GlobalControlBar';
import { StabilityHeroChart } from '@/features/analytics/components/StabilityHeroChart';
import { PulseHeatmap } from '@/features/analytics/components/PulseHeatmap';
import { Award, Zap, TrendingUp, Globe, Activity } from 'lucide-react';
import { DynamicIcon } from '../components/ui/DynamicIcon';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

// NODE_TYPE_LABELS removed in favor of direct i18n lookup in the render function

function StabilityBadge({ score }: { score: number }) {
  const { t } = useTranslation();
  const level = score >= 85 ? t("nodes.stabilityLevels.crystal", "Crystal") 
              : score >= 60 ? t("nodes.stabilityLevels.stable", "Stable") 
              : score >= 30 ? t("nodes.stabilityLevels.developing", "Developing") 
              : t("nodes.stabilityLevels.initiation", "Initiation");
  const colorClass = score >= 85 ? "text-cyan-400 bg-cyan-400/10 border-cyan-400/20"
    : score >= 60 ? "text-green-400 bg-green-400/10 border-green-400/20"
    : score >= 30 ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/20"
    : "text-orange-400 bg-orange-400/10 border-orange-400/20";

  return (
    <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border shadow-sm", colorClass)}>
      {level}
    </span>
  );
}

export default function AnalyticsPage() {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const { focusEntity, rawStabilitySeries } = useAnalyticsStore();
    const { data: nodes = {}, isLoading: nodesLoading } = useNodesQuery(user?.id);

    const systemStats = useMemo(() => {
        const nodesList = Object.values(nodes);
        const totalNodes = nodesList.length;
        const avgStability = totalNodes > 0
            ? Math.round(nodesList.reduce((acc, n) => acc + (n.stability_score || 0), 0) / totalNodes)
            : 0;
        return { totalNodes, avgStability };
    }, [nodes]);

    const [now] = useState(() => Date.now());

    const focusedNodeData = useMemo(() => {
        if (focusEntity?.type !== 'node') return null;
        const node = nodes[focusEntity.id];
        if (!node) return null;

        const nodeImpulses = rawStabilitySeries.filter(s => s.node_id === node.id);
        const totalImpulses = nodeImpulses.reduce((acc, s) => acc + (s.pulse_count || 0), 0);
        const daysInNetwork = Math.floor((now - new Date(node.created_at).getTime()) / 86400000);

        return {
            ...node,
            totalImpulses,
            daysInNetwork
        };
    }, [focusEntity, nodes, rawStabilitySeries, now]);

    useEffect(() => {
        useAnalyticsStore.getState().fetchData(365);
    }, []);

    return (
        <div className="p-4 sm:p-6 mb-20 space-y-6">
            <GlobalControlBar />

            {/* System Summary (Always Visible) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-primary/5 border border-primary/10 rounded-[2rem] p-6 shadow-sm">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Award className="w-4 h-4 text-primary" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                            {t("analytics.systemStats.totalNodes", "Всего узлов")}
                        </span>
                    </div>
                    {nodesLoading ? (
                        <div className="h-8 w-16 bg-muted animate-pulse rounded-lg" />
                    ) : (
                        <p className="text-3xl font-black tracking-tighter">{systemStats.totalNodes}</p>
                    )}
                </div>

                <div className="bg-background border border-border/40 rounded-[2rem] p-6 shadow-sm">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <TrendingUp className="w-4 h-4 text-cyan-400" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                            {t("analytics.systemStats.avgStability", "Стабильность системы")}
                        </span>
                    </div>
                    {nodesLoading ? (
                        <div className="h-8 w-16 bg-muted animate-pulse rounded-lg" />
                    ) : (
                        <p className="text-3xl font-black tracking-tighter text-cyan-400">{systemStats.avgStability}%</p>
                    )}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {focusedNodeData ? (
                    <motion.section
                        key="focused-node"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-8"
                    >
                        {/* Node Header */}
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div 
                                    className="w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-lg"
                                    style={{ 
                                        backgroundColor: `${focusedNodeData.color}15`,
                                        border: `1px solid ${focusedNodeData.color}30`
                                    }}
                                >
                                    <DynamicIcon name={focusedNodeData.icon || 'zap'} className="w-8 h-8" style={{ color: focusedNodeData.color || '#6366f1' }} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h2 className="text-2xl md:text-3xl font-black tracking-tighter">{focusedNodeData.name}</h2>
                                        <StabilityBadge score={focusedNodeData.stability_score || 0} />
                                    </div>
                                    <div className="flex items-center gap-3 text-xs md:text-sm text-muted-foreground font-medium">
                                        <span className="bg-muted/50 px-2.5 py-0.5 rounded-lg border border-border/40">
                                            {t(`nodes.type.${focusedNodeData.node_type}`, focusedNodeData.node_type)}
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-border" />
                                        <span>
                                            {t("public.node.createdAt", "Создан {{date}}", { 
                                                date: new Date(focusedNodeData.created_at).toLocaleDateString(i18n.language === "ru" ? "ru-RU" : "en-US") 
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="text-right">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">
                                    {t("analytics.nodeStats.stability", "Стабильность")}
                                </p>
                                <p className="text-3xl font-black font-mono tracking-tighter" style={{ color: focusedNodeData.color || '#6366f1' }}>
                                    {Math.round(focusedNodeData.stability_score || 0)}%
                                </p>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                            {[
                                { label: t("analytics.nodeStats.completions", "Выполнений"), value: focusedNodeData.completion_count, icon: Award },
                                { label: t("analytics.nodeStats.mass", "Масса узла"), value: focusedNodeData.mass, icon: Zap },
                                { label: t("analytics.nodeStats.impulses", "Импульсов"), value: focusedNodeData.totalImpulses, icon: TrendingUp },
                                { label: t("analytics.nodeStats.daysOnline", "Дней в сети"), value: focusedNodeData.daysInNetwork, icon: Globe },
                            ].map((stat, i) => (
                                <div key={i} className="bg-background/40 border border-border/40 rounded-2xl p-4 shadow-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                        <stat.icon className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">{stat.label}</span>
                                    </div>
                                    <p className="text-xl font-black">{stat.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Charts for focused node */}
                        <div className="space-y-6">
                            <StabilityHeroChart />
                            <PulseHeatmap />
                        </div>
                    </motion.section>
                ) : (
                    <motion.div
                        key="global-stats"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-8"
                    >
                        <StabilityHeroChart />
                        <PulseHeatmap />
                        
                        {/* Hint for selection */}
                        <div className="bg-muted/5 border border-border/10 rounded-[2.5rem] p-8 text-center opacity-80">
                            <div className="w-12 h-12 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-4">
                                <Activity className="w-6 h-6 text-muted-foreground/40" />
                            </div>
                            <h3 className="text-lg font-bold tracking-tight mb-2">{t("analytics.emptyState.selectNodeTitle", "Выберите узел для анализа")}</h3>
                            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                {t("analytics.emptyState.selectNodeDescription", "Нажмите на любой узел в списке или на графе, чтобы увидеть детальную статистику его развития.")}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
