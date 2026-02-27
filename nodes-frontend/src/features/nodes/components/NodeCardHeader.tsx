import { useNavigate } from "react-router-dom";
import { Icons } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Node, Connector } from "@/types";

interface NodeCardHeaderProps {
  node: Node;
  connectors?: Connector[];
  className?: string;
}

/**
 * Заголовок карточки узла (иконка, название, коннекторы)
 */
export function NodeCardHeader({
  node,
  connectors = [],
  className,
}: NodeCardHeaderProps) {
  const navigate = useNavigate();
  const IconComponent = Icons[node.icon || "Circle"] || Icons.Circle;

  // Получаем названия коннекторов по ID
  const getConnectorName = (connectorId: string) => {
    const connector = connectors.find((c) => c.id === connectorId);
    return connector?.name || connectorId.slice(0, 8); // Показываем первые 8 символов если не найдено
  };

  const connectorLabels = (node.connector_ids || [])
    .slice(0, 3)
    .map(getConnectorName);
  const remainingCount = (node.connector_ids?.length || 0) - 3;

  return (
    <div className={cn("flex items-start gap-3 mb-3", className)}>
      {/* Иконка узла */}
      <div
        className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-transform hover:scale-105"
        style={{ backgroundColor: `${node.color}20` }}
      >
        <IconComponent className="w-6 h-6" style={{ color: node.color }} />
      </div>

      {/* Информация */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-lg truncate leading-tight">
            {node.name}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 -mt-1 -mr-1 text-muted-foreground hover:text-primary transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/nodes/edit/${node.id}`);
            }}
          >
            <Icons.Settings className="w-4 h-4" />
          </Button>
        </div>

        {/* Коннекторы */}
        {connectorLabels.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {connectorLabels.map((connName, idx) => (
              <span
                key={idx}
                className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full border border-primary/20 bg-primary/10 text-primary shadow-sm"
              >
                {connName}
              </span>
            ))}
            {remainingCount > 0 && (
              <span className="text-[10px] text-muted-foreground font-medium flex items-center">
                +{remainingCount}
              </span>
            )}
          </div>
        )}

        {/* Тип узла */}
        <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest font-medium opacity-70">
          {node.node_type}
        </p>
      </div>
    </div>
  );
}
