import { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Loader2, Lock, ArrowLeft, Zap, TrendingUp,
  Award, Globe, User, Info
} from "lucide-react";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NodeActivityChart } from "@/features/analytics/components/NodeActivityChart";
import { NodeHeatmap } from "@/features/analytics/components/NodeHeatmap";
import { AppFooter } from "@/components/AppFooter";
import { useTranslation } from "react-i18next";
import { usePublicNodeData } from "@/features/public-sharing/hooks/usePublicData";

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

export default function PublicNodePage() {
  const { t, i18n } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const { node, impulses, profile, isLoading, error } = usePublicNodeData(token);

  useEffect(() => {
    if (node) {
      document.title = `${node.name} · Neural Node · Nodes`;
    }
  }, [node]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !node) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background p-6 text-center">
        <div className="w-20 h-20 rounded-[2rem] bg-destructive/10 flex items-center justify-center border border-destructive/20">
          <Lock className="w-10 h-10 text-destructive" />
        </div>
        <div className="max-w-md">
          <h1 className="text-2xl font-bold mb-2">{t("public.node.nodeUnavailable", "Node Unavailable")}</h1>
          <p className="text-muted-foreground">{t("public.node.nodePrivate", "This node is private or the link is invalid.")}</p>
        </div>
        <Button variant="outline" asChild className="rounded-2xl">
          <Link to="/">{t("public.node.returnHome", "To Home")}</Link>
        </Button>
      </div>
    );
  }

  const nodeColor = node.color || "#6366f1";

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-30 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between backdrop-blur-xl border-b border-border/40 bg-background/40">
        <div className="flex items-center gap-3 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-xl h-9 w-9 sm:h-10 sm:w-10 hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="font-bold text-xs sm:text-sm tracking-tight leading-none">{t("public.node.nodeDetails", "Node Details")}</h2>
            <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground mt-1 font-bold">{t("public.node.publicEntity", "Public Neural Entity")}</p>
          </div>
        </div>

        {profile && (
          <Link
            to={`/share/u/${profile.public_slug}`}
            className="flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl bg-primary/5 border border-primary/10 hover:border-primary/30 transition-all group max-w-[150px] sm:max-w-none"
          >
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
              {(profile.display_name || profile.public_slug || "?")[0].toUpperCase()}
            </div>
            <span className="text-[10px] sm:text-xs font-bold group-hover:text-primary transition-colors truncate">
              {profile.display_name || profile.public_slug}
            </span>
          </Link>
        )}
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 relative z-10">

        {/* Node Hero Section */}
        <section className="bg-background/40 backdrop-blur-xl border border-border/40 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div
            className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[100px] opacity-20 pointer-events-none"
            style={{ backgroundColor: nodeColor }}
          />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="flex flex-col xs:flex-row items-start xs:items-center gap-4 sm:gap-6 w-full md:w-auto">
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-[2rem] flex items-center justify-center text-2xl sm:text-3xl shadow-2xl border border-white/10 shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${nodeColor}, ${nodeColor}dd)`,
                  boxShadow: `0 15px 30px ${nodeColor}33`
                }}
              >
                <DynamicIcon name={node.icon || "zap"} className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tighter truncate max-w-full">{node.name}</h1>
                  <StabilityBadge score={node.stability_score} />
                </div>
                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground font-medium">
                  <span className="bg-muted/50 px-2 py-0.5 rounded-lg border border-border/40">
                    {t(`nodes.type.${node.node_type}`, node.node_type)}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span className="truncate">{t("public.node.createdAt", "Created {{date}}", { date: new Date(node.created_at).toLocaleDateString(i18n.language === "ru" ? "ru-RU" : "en-US") })}</span>
                </div>
              </div>
            </div>

            <div className="text-left md:text-right w-full md:w-auto pt-4 md:pt-0 border-t border-border/10 md:border-none">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-60">{t("public.node.stability", "Stability")}</p>
              <p className="text-2xl sm:text-3xl font-black font-mono tracking-tighter" style={{ color: nodeColor }}>
                {Math.round(node.stability_score)}%
              </p>
            </div>
          </div>

          {node.description && (
            <div className="mt-6 sm:mt-8 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-muted/20 border border-border/40 relative">
              <Info className="absolute top-4 right-4 w-3.5 h-3.5 text-muted-foreground/30" />
              <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground italic">
                "{node.description}"
              </p>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8">
            {[
              { label: t("public.node.stats.completions", "Completions"), value: node.completion_count, icon: Award },
              { label: t("public.node.stats.mass", "Node Mass"), value: node.mass, icon: Zap },
              { label: t("public.node.stats.impulses", "Impulses"), value: impulses.length, icon: TrendingUp },
              { label: t("public.node.stats.daysOnline", "Days Online"), value: Math.floor((Date.now() - new Date(node.created_at).getTime()) / 86400000), icon: Globe },
            ].map((stat, i) => (
              <div key={i} className="bg-background/40 border border-border/40 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm">
                <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground mb-1">
                  <stat.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider">{stat.label}</span>
                </div>
                <p className="text-lg sm:text-xl font-black">{stat.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Charts Grid — переиспользуемые компоненты из аналитики */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <div className="overflow-hidden">
            <NodeActivityChart
              impulses={impulses}
              color={nodeColor}
              isLoading={isLoading}
              days={30}
              title={t("public.node.charts.activityPulse", "Activity Pulse")}
            />
          </div>
          <div className="overflow-hidden">
            <NodeHeatmap
              impulses={impulses}
              nodeName={node.name}
              nodeColor={nodeColor}
              isLoading={isLoading}
              title={t("public.node.charts.impulseHistory", "Impulse History")}
              limitWeeks={undefined} // Let component handle it internally or use hook if I add it
            />
          </div>
        </div>

        {/* Profile Banner */}
        <section className="bg-background/40 backdrop-blur-xl border border-border/40 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center md:items-center justify-between gap-6 sm:gap-8">
          <div className="flex items-center gap-4 sm:gap-6 w-full md:w-auto">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-[2rem] bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner shrink-0">
              <User className="w-7 h-7 sm:w-8 sm:h-8 text-primary opacity-50" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold leading-tight">
                {t("public.node.ownership.belongsTo", "Node belongs to {{name}}", { name: profile?.display_name || profile?.public_slug })}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-sm">
                {t("public.node.ownership.exploreFull", "Explore the full neural graph of this user.")}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Button variant="outline" asChild className="rounded-xl sm:rounded-2xl flex-1 h-11 sm:h-12 px-4 sm:px-6">
              <Link to={`/share/u/${profile?.public_slug}`} className="flex items-center justify-center">
                <Globe className="w-4 h-4 mr-2 shrink-0" />
                <span className="truncate">{t("public.node.ownership.viewFullGraph", "Full Graph")}</span>
              </Link>
            </Button>
            <Button variant="default" asChild className="rounded-xl sm:rounded-2xl flex-1 h-11 sm:h-12 px-4 sm:px-6 shadow-xl shadow-primary/20">
              <Link to="/" className="flex items-center justify-center">
                <Zap className="w-4 h-4 mr-2 shrink-0" />
                <span className="truncate">{t("public.node.ownership.createOwn", "Create Your Own")}</span>
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Shared Footer */}
      <AppFooter />
    </div>
  );
}
