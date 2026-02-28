import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Node, Connector } from "@/types";
import { NodeCardHeader } from "./NodeCardHeader";
import { NodeCardStability } from "./NodeCardStability";
import { NodeCardStats } from "./NodeCardStats";
import { BinaryControl } from "./controls/BinaryControl";
import { QuantityControl } from "./controls/QuantityControl";
import { DurationControl } from "./controls/DurationControl";
import { motion } from "motion/react";
import { memo } from "react";

interface NodeCardProps {
  node: Node;
  isCompletedToday: boolean;
  todayValue?: number; // Для quantity/duration — текущее значение сегодня
  connectors?: Connector[]; // Массив коннекторов для отображения названий
  onImpulse: (value: number) => Promise<void>;
  onUpdateQuantity?: (value: number) => void;
  className?: string;
}

/**
 * Основная карточка узла с футуристичным Glassmorphism дизайном
 */
export const NodeCard = memo(function NodeCard({
  node,
  isCompletedToday,
  todayValue = 0,
  connectors = [],
  onImpulse,
  onUpdateQuantity,
  className,
}: NodeCardProps) {
  // Определяем статус завершенности: либо по явному пропсу (из БД), 
  // либо по текущему значению (если оно достигло цели)
  const isEffectivelyCompleted = isCompletedToday || (
    node.node_type !== 'binary' &&
    todayValue >= (node.target_value || 0) &&
    (node.target_value || 0) > 0
  );

  // Режим Overdrive: превышение цели
  const isOverdrive =
    node.node_type !== 'binary' &&
    todayValue > (node.target_value || 0) &&
    (node.target_value || 0) > 0;

  return (
    <TooltipProvider delayDuration={200}>
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="w-full max-w-md relative group h-full flex flex-col"
      >
        <Card
          className={cn(
            "relative h-full flex flex-col bg-background/80 overflow-hidden",
            "border transition-all duration-700",
            !isEffectivelyCompleted && "border-white/5 shadow-sm",
            isEffectivelyCompleted && !isOverdrive && "border-white/20 shadow-[0_0_20px_rgba(255,255,256,0.03)]",
            isOverdrive && "border-orange-500/40 shadow-[0_4px_20px_rgba(249,115,22,0.1)]",
            className
          )}
          style={isEffectivelyCompleted && !isOverdrive ? {
            borderColor: `${node.color}40`,
            boxShadow: `inset 0 0 20px ${node.color}10`
          } : {}}
        >
          {/* Внутреннее мягкое свечение (Inner Radiance) - перенесено внутрь для clipping */}
          <div
            className={cn(
              "absolute inset-0 z-0 pointer-events-none transition-opacity duration-1000",
              isEffectivelyCompleted ? "opacity-15" : "opacity-0"
            )}
            style={{
              background: `radial-gradient(circle at 50% 0%, ${node.color}, transparent 80%)`
            }}
          />
          {/* Индикатор цвета узла — тонкая градиентная линия */}
          <div
            className={cn(
              "absolute top-0 left-0 right-0 h-px z-10 opacity-80",
              isOverdrive && "bg-gradient-to-r from-orange-400 via-yellow-300 to-orange-400 h-[2px] shadow-[0_0_10px_rgba(249,115,22,0.5)]"
            )}
            style={!isOverdrive ? {
              background: isEffectivelyCompleted
                ? `linear-gradient(90deg, transparent 0%, ${node.color} 50%, transparent 100%)`
                : `linear-gradient(90deg, ${node.color}aa 0%, transparent 100%)`
            } : {}}
          />

          <CardContent className="p-4 space-y-4 flex-1 mt-2 relative z-10">
            {/* Заголовок */}
            <NodeCardHeader node={node} connectors={connectors} />

            {/* Описание с tooltip */}
            {node.description && node.description.trim() && (
              <div className="text-sm text-muted-foreground">
                {node.description.length > 60 ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="line-clamp-2 cursor-help hover:text-foreground transition-colors">
                        {node.description}
                      </p>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="text-sm">{node.description}</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <p>{node.description}</p>
                )}
              </div>
            )}

            {/* Стабильность */}
            <NodeCardStability stabilityScore={node.stability_score} color={node.color} />

            {/* Статистика */}
            <NodeCardStats completionCount={node.completion_count} />
          </CardContent>

          {/* Footer с кнопками — легкий градиент вместо жесткого разделителя */}
          <CardFooter className="p-4 bg-gradient-to-t from-muted/20 to-transparent border-t border-muted/30 mt-auto">
            {/* Элементы управления по типу узла */}
            {node.node_type === "binary" && (
              <BinaryControl
                node={node}
                isCompletedToday={isCompletedToday}
                onImpulse={onImpulse}
                className=""
              />
            )}

            {node.node_type === "quantity" && (
              <QuantityControl
                node={node}
                currentValue={todayValue}
                onImpulse={onImpulse}
                onUpdateValue={onUpdateQuantity || (() => { })}
              />
            )}

            {node.node_type === "duration" && (
              <DurationControl
                node={node}
                elapsedToday={todayValue}
                isCompletedToday={isCompletedToday}
                onImpulse={onImpulse}
              />
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </TooltipProvider>
  );
});
