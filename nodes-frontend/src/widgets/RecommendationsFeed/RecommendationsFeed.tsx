import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { recommendationApi, RecommendationCard } from "@/entities/recommendation";
import { Loader2, Sparkles, Filter, Bookmark, Play, BookOpen, Github, Code, RefreshCw, Settings, ShoppingCart } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslation } from "react-i18next";
import type { UpdateRecommendationDto } from "@/entities/recommendation/model/types";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Link } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";
import { useProfileQuery } from "@/features/profile/hooks/useProfileQuery";

type FilterType = "all" | "saved" | "video" | "book" | "course" | "github" | "article" | "product";

export const RecommendationsFeed = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: profile } = useProfileQuery(user?.id);
  const queryClient = useQueryClient();
  const [activeFilters, setActiveFilters] = useState<FilterType[]>(["all"]);

  const toggleFilter = (filter: FilterType) => {
    setActiveFilters(prev => {
      if (filter === "all") return ["all"];
      
      const newFilters = prev.filter(f => f !== "all");
      if (newFilters.includes(filter)) {
        const updated = newFilters.filter(f => f !== filter);
        return updated.length === 0 ? ["all"] : updated;
      } else {
        return [...newFilters, filter];
      }
    });
  };

  const { data: recommendations, isLoading, error, isRefetching } = useQuery({
    queryKey: ["recommendations"],
    queryFn: recommendationApi.getRecommendations,
    enabled: !!user?.id && profile?.show_recommendations !== false,
  });

  const { data: status } = useQuery({
    queryKey: ["recommendation-status"],
    queryFn: recommendationApi.getRecommendationStatus,
    enabled: !!user?.id && profile?.show_recommendations !== false,
  });

  const generateMutation = useMutation({
    mutationFn: recommendationApi.generateRecommendations,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
      queryClient.invalidateQueries({ queryKey: ["recommendation-status"] });
      toast.success("Рекомендации обновлены");
    },
    onError: () => {
      toast.error("Не удалось обновить рекомендации");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRecommendationDto }) => 
      recommendationApi.updateRecommendation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
    },
  });

  const filteredRecs = useMemo(() => {
    if (!recommendations) return [];
    if (activeFilters.includes("all")) return recommendations;

    return recommendations.filter(rec => {
      return activeFilters.some(filter => {
        if (filter === "saved") return rec.is_saved;
        if (filter === "video") return rec.content_type === "video";
        if (filter === "book") return rec.content_type === "book";
        if (filter === "github") return rec.source === "GitHub";
        if (filter === "article") return rec.source === "Habr";
        if (filter === "course") return rec.source === "Stepik" || rec.content_type === "course";
        if (filter === "product") return rec.content_type === "product";
        return false;
      });
    });
  }, [recommendations, activeFilters]);

  // Группировка по узлам для секционирования
  const sections = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredRecs.forEach(rec => {
      const groupName = rec.connectors?.[0]?.name || "General";
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(rec);
    });
    return Object.entries(groups);
  }, [filteredRecs]);

  if (profile?.show_recommendations === false) {
    return (
      <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-12 text-center backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
          <Settings size={32} />
        </div>
        <h3 className="mb-2 text-xl font-bold text-white/90">
          {t("recommendations.disabled.title", "Рекомендации отключены")}
        </h3>
        <p className="mx-auto mb-8 max-w-[320px] text-sm leading-relaxed text-white/40">
          {t("recommendations.disabled.description", "Вы отключили персональные рекомендации в настройках профиля. Включите их, чтобы получать идеи для развития на основе ваших привычек.")}
        </p>
        <Link 
          to="/profile"
          className="inline-flex h-11 items-center gap-2 rounded-2xl bg-white px-6 text-sm font-bold text-black transition-all hover:bg-indigo-50 hover:scale-[1.02] active:scale-95"
        >
          <Settings size={16} />
          {t("recommendations.disabled.action", "Перейти в настройки")}
        </Link>
      </div>
    );
  }

  if (isLoading && !isRefetching) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
        <p className="text-sm font-medium text-white/30 animate-pulse">{t("common.loading")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center">
        <p className="text-sm text-red-400">{t("recommendations.error")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Панель фильтров и действий */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex flex-wrap items-center gap-2 overflow-hidden">
          <FilterButton 
            active={activeFilters.includes("all")} 
            onClick={() => toggleFilter("all")}
            icon={<Filter size={14} />}
            label="Все"
          />
          <FilterButton 
            active={activeFilters.includes("saved")} 
            onClick={() => toggleFilter("saved")}
            icon={<Bookmark size={14} />}
            label="Избранное"
          />
          <div className="mx-2 h-4 w-px bg-white/10" />
          <FilterButton 
            active={activeFilters.includes("video")} 
            onClick={() => toggleFilter("video")}
            icon={<Play size={14} />}
            label="YouTube"
          />
          <FilterButton 
            active={activeFilters.includes("book")} 
            onClick={() => toggleFilter("book")}
            icon={<BookOpen size={14} />}
            label="Книги"
          />
          <FilterButton 
            active={activeFilters.includes("github")} 
            onClick={() => toggleFilter("github")}
            icon={<Github size={14} />}
            label="GitHub"
          />
          <FilterButton 
            active={activeFilters.includes("article")} 
            onClick={() => toggleFilter("article")}
            icon={<Code size={14} />}
            label="Habr"
          />
          <FilterButton 
            active={activeFilters.includes("product")} 
            onClick={() => toggleFilter("product")}
            icon={<ShoppingCart size={14} />}
            label="Товары"
          />
        </div>

        <button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending || isRefetching || (status && !status.can_generate)}
          className="group relative flex h-10 items-center gap-2 rounded-2xl bg-indigo-500/10 px-4 text-xs font-bold text-indigo-400 transition-all hover:bg-indigo-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw size={14} className={cn((generateMutation.isPending || isRefetching) && "animate-spin")} />
          <span>
            {generateMutation.isPending || isRefetching 
              ? "Обновление..." 
              : `Обновить ${status ? (status.remaining > 0 ? `(${status.remaining}/${status.limit})` : "(Безлимит)") : ""}`
            }
          </span>
          
          {status && status.remaining === 0 && (
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 scale-0 rounded-lg bg-black/90 px-3 py-1.5 text-[10px] text-white transition-all group-hover:scale-100 whitespace-nowrap pointer-events-none z-50">
              Лимит YouTube/Книг исчерпан. <br/>
              Обновляются товары и статьи.
              <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-black/90" />
            </div>
          )}
        </button>
      </div>

      {filteredRecs.length === 0 ? (
        <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-12 text-center backdrop-blur-sm">
          <Sparkles className="mx-auto mb-4 text-indigo-400 opacity-30" size={48} />
          <h3 className="mb-2 text-lg font-semibold text-white/90">
            {t("recommendations.empty.title")}
          </h3>
          <p className="mx-auto max-w-[280px] text-sm leading-relaxed text-white/40">
            {t("recommendations.empty.description")}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-12">
          {sections.map(([groupName, items]) => (
            <section key={groupName} className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 flex items-center gap-2">
                  <span className="opacity-50">{t("recommendations.sections.basedOnNode", "Для вашего узла")}:</span>
                  <span className="text-indigo-400">{groupName}</span>
                </h2>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {items.map((rec) => (
                    <RecommendationCard
                      key={rec.id}
                      recommendation={rec}
                      onSave={(id) => updateMutation.mutate({ id, data: { is_saved: !rec.is_saved } })}
                      onDiscard={(id) => updateMutation.mutate({ id, data: { is_discarded: true } })}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  isComingSoon?: boolean;
}

const FilterButton = ({ active, onClick, icon, label, isComingSoon }: FilterButtonProps) => (
  <button
    onClick={onClick}
    disabled={isComingSoon}
    className={cn(
      "relative flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all whitespace-nowrap",
      active 
        ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
        : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white",
      isComingSoon && "opacity-40 cursor-not-allowed grayscale"
    )}
  >
    {icon}
    {label}
    {isComingSoon && (
      <span className="ml-1 text-[8px] uppercase tracking-tighter opacity-60">Скоро</span>
    )}
    {active && (
      <motion.div
        layoutId="active-filter-bg"
        className="absolute inset-0 rounded-full bg-white -z-10"
        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
      />
    )}
  </button>
);
