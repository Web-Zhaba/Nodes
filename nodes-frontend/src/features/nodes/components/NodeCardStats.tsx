import { cn } from "@/lib/utils";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import Circle from "lucide-react/dist/esm/icons/circle";
import { useTranslation } from "react-i18next";

interface NodeCardStatsProps {
  completionCount: number;
  className?: string;
}

/**
 * Статистика узла (счётчик выполнений)
 */
export function NodeCardStats({
  completionCount,
  className,
}: NodeCardStatsProps) {
  const { t } = useTranslation();

  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      {completionCount > 0 ? (
        <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
      ) : (
        <Circle className="w-4 h-4 text-muted-foreground" />
      )}
      <span className="text-muted-foreground">{t("nodes.completedCount", "Выполнено")}:</span>
      <span className="font-semibold text-foreground">{completionCount}</span>
    </div>
  );
}
