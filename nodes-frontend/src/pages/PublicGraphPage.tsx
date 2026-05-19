import { useMemo, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Loader2 } from 'lucide-react';
import { Lock } from 'lucide-react';
import { ExternalLink } from 'lucide-react';
import { Zap } from 'lucide-react';
import { Globe } from 'lucide-react';
import { Info } from 'lucide-react';
import { GraphCommandCenter } from "@/features/graph-visualization/components/GraphCommandCenter";
import { Button } from "@/components/ui/button";
import { AppFooter } from "@/components/AppFooter";
import { useTranslation } from "react-i18next";
import { usePublicProfileData } from "@/features/public-sharing/hooks/usePublicData";

export default function PublicGraphPage() {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { profile, graph, graphData, isLoading, error } = usePublicProfileData(slug);

  const {
    nodes: nodesRaw = [],
    cores: coresRaw = [],
    connectors: connectorsRaw = [],
    coreConnectors: coreConnectorsRaw = []
  } = graph || {};

  // Формируем карты для быстрого доступа
  const nodesMap = useMemo(() => {
    const map: Record<string, any> = {};
    nodesRaw.forEach(n => { map[n.id] = n; });
    return map;
  }, [nodesRaw]);

  const coresMap = useMemo(() => {
    const map: Record<string, any> = {};
    coresRaw.forEach(c => { map[c.id] = c; });
    return map;
  }, [coresRaw]);

  const connectorsMap = useMemo(() => {
    const map: Record<string, any> = {};
    connectorsRaw.forEach((c: any) => { map[c.id] = c; });
    return map;
  }, [connectorsRaw]);

  const coreConnectorsMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    coreConnectorsRaw.forEach((cc: any) => {
      if (!map[cc.core_id]) map[cc.core_id] = [];
      map[cc.core_id].push(cc.connector_id);
    });
    return map;
  }, [coreConnectorsRaw]);

  // SEO
  useEffect(() => {
    if (profile) {
      document.title = `${profile.display_name || profile.public_slug} — Neural Graph · Nodes`;
    }
  }, [profile]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background p-6 text-center">
        <div className="w-20 h-20 rounded-[2rem] bg-destructive/10 flex items-center justify-center border border-destructive/20 shadow-2xl shadow-destructive/10">
          <Lock className="w-10 h-10 text-destructive" />
        </div>
        <div className="max-w-md">
          <h1 className="text-3xl font-bold tracking-tight mb-2">{t("public.profile.graphUnavailable", "Граф недоступен")}</h1>
          <p className="text-muted-foreground">{t("public.profile.profilePrivate", "Этот профиль приватный или не существует.")}</p>
        </div>
        <Button variant="outline" asChild className="rounded-2xl">
          <Link to="/">{t("public.profile.returnHome", "Вернуться на главную")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/20 overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-20 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between backdrop-blur-xl border-b border-border/40 bg-background/40">
        <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
          <div
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-xl shadow-primary/20 border border-white/10 shrink-0"
            style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}
          >
            {(profile.display_name || profile.public_slug || "?")[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm sm:text-lg tracking-tight leading-none truncate">
                {profile.display_name || profile.public_slug}
              </h1>
              <span className="hidden sm:inline-block bg-primary/10 text-primary text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-primary/20 whitespace-nowrap">
                {t("public.profile.publicView", "Public View")}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground mt-1 truncate">
              <Globe className="w-3 h-3 shrink-0" />
              <span className="font-mono truncate">nodes.life/{profile.public_slug}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden xs:flex items-center gap-2 bg-background/50 border border-border/40 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-1.5 sm:py-2 shadow-sm">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] sm:text-xs font-semibold">{t("public.profile.nodesCount", "{{count}} узлов", { count: nodesRaw.length })}</span>
          </div>
          <Button variant="default" size="sm" asChild className="rounded-xl sm:rounded-2xl h-9 sm:h-10 px-4 sm:px-5 font-semibold shadow-xl shadow-primary/20 text-xs sm:text-sm">
            <Link to="/">
              <ExternalLink className="w-3.5 h-3.5 mr-1.5 sm:mr-2" />
              {t("public.profile.join", "Присоединиться")}
            </Link>
          </Button>
        </div>
      </header>

      {/* Main: bio + graph */}
      <main className="flex-1 flex flex-col p-3 sm:p-4 gap-3 sm:gap-4 relative z-10">
        {/* Bio card */}
        {profile.bio && (
          <div className="flex items-start gap-3 px-4 sm:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-background/40 border border-border/40 backdrop-blur-md shadow-sm max-w-xl">
            <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-1" />
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed italic">{profile.bio}</p>
          </div>
        )}

        {/* Graph + Command Center */}
        <div className="flex-1 rounded-[2rem] sm:rounded-[2.5rem] border border-border/40 bg-background/20 backdrop-blur-md shadow-2xl overflow-hidden relative min-h-[450px] sm:min-h-[500px]">
          <GraphCommandCenter
            graphData={graphData}
            nodes={nodesRaw.map(n => ({
              id: n.id,
              name: n.name,
              node_type: n.node_type,
              color: n.color,
              icon: n.icon,
              stability_score: n.stability_score,
              share_token: n.share_token
            }))}
            cores={coresRaw.map(c => ({
              id: c.id,
              name: c.name,
              color: c.color,
              icon: c.icon,
              stability_score: c.stability_score,
              description: c.description
            }))}
            nodesMap={nodesMap}
            coresMap={coresMap}
            connectors={connectorsMap}
            coreConnectors={coreConnectorsMap}
            readOnly
            onNodeNavigate={(token) => navigate(`/share/n/${token}`)}
          />
        </div>
      </main>

      <AppFooter className="relative z-10" />
    </div>
  );
}
