import { useTranslation } from "react-i18next";
import { RecommendationsFeed } from "@/widgets/RecommendationsFeed/RecommendationsFeed";
import { Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

const RecommendationsPage = () => {
  const { t } = useTranslation();

  return (
    <div className={cn(
      "w-full max-w-7xl mx-auto flex flex-col relative gap-8 p-4 sm:p-6 mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700"
    )}>
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">
            {t("recommendations.category", "Обучение")}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-foreground via-foreground to-foreground/50">
            {t("recommendations.title", "Рекомендации")}
          </h1>
          <p className="text-xs sm:text-sm font-bold uppercase tracking-widest flex items-center gap-1.5 mt-1 opacity-80 text-indigo-400">
            <Lightbulb className="w-3.5 h-3.5" />
            {t("recommendations.subtitle", "Идеи для развития")}
          </p>
        </div>
      </header>

      {/* Content Area (Natural height, consistent width) */}
      <div className="flex-1">
        <RecommendationsFeed />
      </div>
    </div>
  );
};

export default RecommendationsPage;
