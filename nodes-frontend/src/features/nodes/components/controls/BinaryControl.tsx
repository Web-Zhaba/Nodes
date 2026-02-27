import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Check, Zap } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";
import type { Node } from "@/types";

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

  const handleClick = async () => {
    if (isPending) return;

    setIsPending(true);

    try {
      if (isCompletedToday) {
        // Можно добавить undo функциональность позже
        toast.info("Уже выполнено сегодня", {
          description: "Отдыхай, ты заслужил!",
        });
      } else {
        await onImpulse(1);
        toast.success("Узел выполнен!", {
          description: `+к стабильности "${node.name}"`,
        });
      }
    } catch (error) {
      toast.error("Ошибка", {
        description: "Не удалось отметить выполнение",
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className={cn("space-y-2 w-full mt-auto", className)}>
      <motion.div
        whileTap={!isPending && !isCompletedToday ? { scale: 0.97 } : {}}
        className="w-full"
      >
        <Button
          onClick={handleClick}
          disabled={isPending}
          className={cn(
            "w-full transition-colors duration-300 shadow-sm",
            isCompletedToday
              ? "bg-green-500 hover:bg-green-600 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]"
              : "bg-primary hover:bg-primary/90",
          )}
          size="lg"
        >
          {isCompletedToday ? (
            <>
              <Check className="w-5 h-5 mr-2" />
              Выполнено сегодня
            </>
          ) : (
            <>
              <Check className="w-5 h-5 mr-2" />
              Отметить выполнение
            </>
          )}
        </Button>
      </motion.div>

      {isCompletedToday ? (
        <p className="text-xs text-center text-green-500/80 font-medium flex items-center justify-center gap-1">
          <Zap className="w-3 h-3" />
          Продолжай в том же духе!
        </p>
      ) : (
        <p className="text-xs text-center text-muted-foreground/70">
          Сегодня еще не выполнялось
        </p>
      )}
    </div>
  );
}
