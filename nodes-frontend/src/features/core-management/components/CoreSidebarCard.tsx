import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { useTranslation } from "react-i18next";
import { Sparkles } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { ConnectorTag } from "@/components/ui/connector-tag";
import { Card, CardContent } from "@/components/ui/card";
import { NodeCardStability } from "@/features/nodes/components/NodeCardStability";
import type { Core, Connector, CoreConnector, Node } from "@/types";
import { getNodesForCore } from "@/entities/core/model/coreSelectors";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

interface CoreSidebarCardProps {
  core: Core;
  nodes: Record<string, Node>;
  coreConnectors: Record<string, CoreConnector>;
  connectors: Record<string, Connector>;
  isSelected: boolean;
  onClick?: () => void;
  actionButtons?: React.ReactNode;
}

export function CoreSidebarCard({
  core,
  nodes,
  coreConnectors,
  connectors,
  isSelected,
  onClick,
  actionButtons,
}: CoreSidebarCardProps) {
  const { t } = useTranslation();
  const affectedNodes = getNodesForCore(nodes, coreConnectors, core.id);


  // Получаем коннекторы этого ядра
  const coreConnIds = Object.values(coreConnectors)
    .filter((cc) => cc.core_id === core.id)
    .map((cc) => cc.connector_id);
  const coreConns = Object.values(connectors).filter((c) =>
    coreConnIds.includes(c.id)
  );

  return (
    <motion.div
      whileHover={onClick ? { scale: 1.02, y: -2 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="w-full relative group"
    >
      <Card
        onClick={onClick}
        className={cn(
          "relative flex flex-col bg-background/80 overflow-hidden",
          "border transition-all duration-700",
          onClick && "cursor-pointer",
          isSelected 
            ? "border-white/20 shadow-[0_0_20px_rgba(255,255,256,0.03)]" 
            : "border-white/5 shadow-sm hover:border-white/20"
        )}
        style={isSelected ? {
          borderColor: `${core.color}40`,
          boxShadow: `inset 0 0 20px ${core.color}10`
        } : {}}
      >
        {/* Внутреннее мягкое свечение (Inner Radiance) */}
        <div
          className={cn(
            "absolute inset-0 z-0 pointer-events-none transition-opacity duration-1000",
            isSelected ? "opacity-15" : "opacity-0 group-hover:opacity-10"
          )}
          style={{
            background: `radial-gradient(circle at 50% 0%, ${core.color}, transparent 80%)`
          }}
        />
        {/* Индикатор цвета ядра — тонкая градиентная линия */}
        <div
          className="absolute top-0 left-0 right-0 h-px z-10 opacity-80"
          style={{
            background: isSelected
              ? `linear-gradient(90deg, transparent 0%, ${core.color} 50%, transparent 100%)`
              : `linear-gradient(90deg, ${core.color}aa 0%, transparent 100%)`
          }}
        />

        <CardContent className={cn("p-4 space-y-4 relative z-10", !actionButtons && "mt-1")}>
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div 
                className={cn(
                  "flex items-center justify-center rounded-xl p-2 shrink-0 transition-all duration-500",
                  isSelected ? "bg-background/80 shadow-inner" : "bg-muted/30"
                )}
                style={{
                  boxShadow: isSelected ? `inset 0 0 10px ${core.color}20` : undefined
                }}
              >
                <DynamicIcon name={core.icon || "circle"}
                  className={cn("w-6 h-6 transition-transform duration-500", isSelected && "scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]")}
                  style={{ color: core.color }}
                />
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <h3 className="font-bold tracking-tight text-lg truncate leading-tight mt-1">
                  {core.name}
                </h3>
              </div>
            </div>
            {/* Actions / Info badge */}
            <div className="flex flex-col items-end shrink-0 gap-2">
              {actionButtons ? (
                actionButtons
              ) : (
                <div className="flex items-center gap-1.5 opacity-80 bg-muted/40 rounded-full px-2 py-1 shadow-inner">
                  <Sparkles className="w-3.5 h-3.5 text-primary" style={{ color: core.color }} />
                  <span className="text-xs font-bold font-mono tracking-wider">{affectedNodes.length}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {actionButtons && (
              <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium mb-1">
                <Sparkles className="w-3.5 h-3.5" style={{ color: core.color }} />
                {t("graph.sidebar.nodesCount")} <Badge variant="secondary" className="px-1.5 h-4.5 font-bold">{affectedNodes.length}</Badge>
              </span>
            )}

            {coreConns.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {coreConns.slice(0, 3).map((conn) => (
                  <ConnectorTag
                    key={conn.id}
                    name={conn.name}
                    color={conn.color}
                    size="sm"
                    variant="ghost"
                    className="bg-muted/30 hover:bg-muted/50"
                  />
                ))}
                {coreConns.length > 3 && (
                  <Badge variant="outline" className="bg-muted/10 text-[10px] uppercase font-bold tracking-wider rounded-md border-dashed">
                    +{coreConns.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Стабильность */}
            <NodeCardStability stabilityScore={core.stability_score} color={core.color} className="pt-1" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
