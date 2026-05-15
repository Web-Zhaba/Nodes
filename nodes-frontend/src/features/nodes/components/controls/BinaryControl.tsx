import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Check from "lucide-react/dist/esm/icons/check";
import Zap from "lucide-react/dist/esm/icons/zap";
import { toast } from "sonner";
import { motion } from "motion/react";
import type { Node } from "@/types";
import { useTranslation } from "react-i18next";
import { hapticImpact, hapticNotification } from "@/services/haptics.service";

interface BinaryControlProps {
  node: Node;
  isCompletedToday: boolean;
  onImpulse: (value: number) => Promise<void>;
  className?: string;
}

/**
 * Контрол для Binary узлов (Да/Нет)
 */
export function BinaryControl({
  node,
  isCompletedToday,
  onImpulse,
  className,
}: BinaryControlProps) {
  const [isPending, setIsPending] = useState(false);
  const { t } = useTranslation();

  const handleClick = async () => {
    if (isPending) return;

    setIsPending(true);

    try {
      if (isCompletedToday) {
        await onImpulse(0);
        hapticImpact('medium');
        toast.success(t("nodes.controls.binary.marked", "Отметка снята"), {
          description: t("nodes.controls.binary.markedDescription", "Выполнение за сегодня отменено"),
        });
      } else {
        await onImpulse(1);
        hapticImpact('medium');
        toast.success(t("nodes.controls.binary.completed", "Узел выполнен!"), {
          description: t("nodes.controls.binary.completedDescription", { name: node.name }),
        });
      }
    } catch (error) {
      hapticNotification('error');
      toast.error(t("common.error"), {
        description: t("nodes.controls.binary.error", "Не удалось отметить выполнение"),
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className={cn("space-y-2 w-full mt-auto", className)}>
      <motion.div
        whileTap={!isPending ? { scale: 0.97 } : {}}
        className="w-full group"
      >
        <Button
          onClick={handleClick}
          disabled={isPending}
          className={cn(
            "w-full transition-colors duration-300 shadow-sm",
            isCompletedToday
              ? "bg-green-500 hover:bg-red-500/90 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]"
              : "bg-primary hover:bg-primary/90",
          )}
          size="lg"
        >
          {isCompletedToday ? (
            <div className="flex items-center">
              <span className="flex items-center group-hover:hidden">
                <Check className="w-5 h-5 mr-2" />
                {t("nodes.controls.binary.buttonCompleted", "Выполнено сегодня")}
              </span>
              <span className="hidden items-center group-hover:flex">
                <Zap className="w-5 h-5 mr-2 rotate-180" />
                {t("nodes.controls.binary.buttonCancel", "Отменить выполнение")}
              </span>
            </div>
          ) : (
            <>
              <Check className="w-5 h-5 mr-2" />
              {t("nodes.controls.binary.buttonMark", "Отметить выполнение")}
            </>
          )}
        </Button>
      </motion.div>

      {isCompletedToday ? (
        <p className="text-xs text-center text-green-500/80 font-medium flex items-center justify-center gap-1">
          <Zap className="w-3 h-3" />
          {t("nodes.controls.binary.keepGoing", "Продолжай в том же духе!")}
        </p>
      ) : (
        <p className="text-xs text-center text-muted-foreground/70">
          {t("nodes.controls.binary.notDone", "Сегодня еще не выполнялось")}
        </p>
      )}
    </div>
  );
}
