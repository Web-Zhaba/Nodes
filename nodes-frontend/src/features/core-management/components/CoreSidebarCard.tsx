import { Icons } from "@/lib/icons";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ConnectorTag } from "@/components/ui/connector-tag";
import type { Core, Connector, CoreConnector, Node } from "@/types";
import { getNodesForCore } from "@/entities/core/model/coreSelectors";
import { cn } from "@/lib/utils";

interface CoreSidebarCardProps {
  core: Core;
  nodes: Record<string, Node>;
  coreConnectors: Record<string, CoreConnector>;
  connectors: Record<string, Connector>;
  isSelected: boolean;
  onClick: () => void;
}

export function CoreSidebarCard({
  core,
  nodes,
  coreConnectors,
  connectors,
  isSelected,
  onClick,
}: CoreSidebarCardProps) {
  const affectedNodes = getNodesForCore(nodes, coreConnectors, core.id);
  const CoreIcon = Icons[core.icon as keyof typeof Icons] || Icons.Circle;

  // Получаем коннекторы этого ядра
  const coreConnIds = Object.values(coreConnectors)
    .filter((cc) => cc.core_id === core.id)
    .map((cc) => cc.connector_id);
  const coreConns = Object.values(connectors).filter((c) =>
    coreConnIds.includes(c.id)
  );

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden p-4 rounded-2xl border bg-card text-card-foreground transition-all cursor-pointer shadow-sm hover:shadow-md",
        isSelected 
          ? "border-primary bg-primary/5 shadow-primary/10" 
          : "hover:bg-muted/50 hover:border-primary/30"
      )}
    >
      <div
        className={cn(
          "absolute top-0 left-0 w-1.5 h-full transition-all",
          isSelected ? "opacity-100" : "opacity-40 group-hover:opacity-100"
        )}
        style={{ backgroundColor: core.color }}
      />
      <div className="ml-3">
        <h4 className="font-bold tracking-tight text-lg flex items-center gap-1.5">
          <CoreIcon 
            className={cn("w-5 h-5 transition-transform", isSelected && "scale-110")} 
            style={{ color: isSelected ? core.color : undefined }}
          />
          {core.name}
        </h4>
        
        <div className="mt-2 space-y-2">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3 h-3 text-primary" />
            Узлов в системе: <Badge variant="secondary" className="px-1.5 h-4.5 font-bold">{affectedNodes.length}</Badge>
          </p>

          {coreConns.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {coreConns.slice(0, 3).map((conn) => (
                <ConnectorTag
                  key={conn.id}
                  name={conn.name}
                  color={conn.color}
                  size="sm"
                  variant="ghost"
                  className="bg-muted/30"
                />
              ))}
              {coreConns.length > 3 && (
                <span className="text-[10px] text-muted-foreground font-bold">
                  +{coreConns.length - 3}
                </span>
              )}
            </div>
          )}

          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-70">
              <span>Стабильность</span>
              <span style={{ color: core.color }}>{core.stability_score}%</span>
            </div>
            <div className="h-1.5 w-full bg-muted/50 overflow-hidden rounded-full border border-white/5">
              <div
                className="h-full transition-all duration-700 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.2)]"
                style={{
                  width: `${core.stability_score}%`,
                  backgroundColor: core.color || "var(--primary)",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
