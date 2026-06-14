import { motion } from "motion/react";
import { ExternalLink, Bookmark, Play } from "lucide-react";
import type { Recommendation, Connector } from "@/types";
import { cn } from "@/lib/utils";
import { useRecommendationMetadata } from "../model/useRecommendationMetadata";
import { useTranslation } from "react-i18next";

interface RecommendationCardProps {
  recommendation: Recommendation;
  onSave?: (id: string) => void;
  onDiscard?: (id: string) => void;
  onRecordPulse?: (nodeId: string, nodeName: string) => void;
  className?: string;
}

export const RecommendationCard = ({ 
  recommendation, 
  onSave, 
  onDiscard: _onDiscard, 
  onRecordPulse,
  className 
}: RecommendationCardProps) => {
  const { t } = useTranslation();
  const { title, description, content_type, url, thumbnail_url, source, connectors, node } = recommendation;
  const { Icon, sourceMeta } = useRecommendationMetadata(content_type, source);
  const SourceIcon = sourceMeta.icon;

  const handlePlayClick = () => {
    // Открываем URL рекомендации в новой вкладке
    window.open(url, "_blank", "noopener,noreferrer");
    // Если рекомендация привязана к узлу, записываем импульс
    if (node) {
      onRecordPulse?.(node.id, node.name);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[24px] border border-white/5 bg-[#0D0D0E]/60 backdrop-blur-md transition-all duration-300 hover:border-indigo-500/30 hover:bg-[#121215]/80 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1",
        className
      )}
    >
      {/* Идентификатор источника (Badge) */}
      <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-black/50 px-2 py-1 backdrop-blur-md border border-white/10">
        <SourceIcon size={12} style={{ color: sourceMeta.color }} />
        <span className="text-[10px] font-bold text-white/90">{source}</span>
      </div>

      {thumbnail_url ? (
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          <img 
            src={thumbnail_url} 
            alt={title} 
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-transparent to-transparent" />
        </div>
      ) : (
        <div className="flex aspect-[16/10] w-full items-center justify-center bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
          <Icon size={48} className="text-white/5" />
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {connectors?.map((connector: Connector) => (
            <div 
              key={connector.id}
              className="rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ring-1 ring-inset"
              style={{ 
                color: connector.color, 
                backgroundColor: `${connector.color}15`,
                borderColor: `${connector.color}30`
              }}
            >
              {connector.name}
            </div>
          ))}
        </div>

        <h3 className="mb-2 line-clamp-2 text-[15px] font-bold leading-tight tracking-tight text-white/95 group-hover:text-indigo-300 transition-colors">
          {title}
        </h3>
        
        {description && (
          <p className="mb-5 line-clamp-2 text-xs leading-relaxed text-white/40">
            {description}
          </p>
        )}

        {/* Action Bar */}
        <div className="mt-auto flex items-center gap-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-2xl bg-white text-black transition-all hover:bg-indigo-50 hover:scale-[1.02] active:scale-95 text-xs font-black"
          >
            {t("recommendations.actions.open")} <ExternalLink size={14} />
          </a>
          
          <button
            onClick={() => onSave?.(recommendation.id)}
            title={recommendation.is_saved ? t("recommendations.actions.unsave", "Убрать из избранного") : t("recommendations.actions.save", "В избранное")}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-2xl border transition-all active:scale-90",
              recommendation.is_saved 
                ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-400" 
                : "bg-white/5 border-white/5 text-white/40 hover:border-white/20 hover:text-white"
            )}
          >
            <Bookmark size={18} fill={recommendation.is_saved ? "currentColor" : "none"} />
          </button>

          {/* Кнопка "В работу" (Записывает импульс и открывает ссылку) */}
          {node && (
            <button
              onClick={handlePlayClick}
              title={t("recommendations.actions.startStudy", `Начать изучение и записать импульс для "${node.name}"`, { name: node.name })}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-110 active:scale-90"
            >
              <Play size={18} fill="currentColor" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
