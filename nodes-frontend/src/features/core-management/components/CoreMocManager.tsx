import { getNodesForCore } from "@/entities/core/model/coreSelectors";
import { Icons } from "@/lib/icons";
import { useCoreConnectorsQuery, useToggleCoreConnectorMutation } from "@/features/core-management/hooks/useCoresQuery";
import { useNodesQuery } from "@/features/nodes/hooks/useNodesQuery";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConnectorSelector } from "@/entities/connector/ui/ConnectorSelector";
import { useMemo } from "react";

interface CoreMocManagerProps {
  coreId: string;
}

export function CoreMocManager({ coreId }: CoreMocManagerProps) {
  const { user } = useAuth();
  
  const { data: coreConnectors = {} } = useCoreConnectorsQuery(user?.id);
  const { data: nodes = {} } = useNodesQuery(user?.id);
  
  const toggleMutation = useToggleCoreConnectorMutation();
  
  // Get nodes that are semantically linked to this core
  // We re-use getNodesForCore selector by passing a mock state
  const linkedNodes = getNodesForCore(nodes, coreConnectors, coreId);

  const linkedConnectorIds = useMemo(() => {
    return Object.values(coreConnectors)
      .filter((cc) => cc.core_id === coreId)
      .map((cc) => cc.connector_id);
  }, [coreConnectors, coreId]);

  const handleChange = async (newIds: string[]) => {
    try {
      const toAdd = newIds.filter((id) => !linkedConnectorIds.includes(id));
      const toRemove = linkedConnectorIds.filter((id) => !newIds.includes(id));

      // Выполняем мутации для всех измененных связей
      for (const id of toAdd) {
        await toggleMutation.mutateAsync({ coreId, connectorId: id, isLinked: true });
      }
      for (const id of toRemove) {
        await toggleMutation.mutateAsync({ coreId, connectorId: id, isLinked: false });
      }
    } catch (error) {
      toast.error("Ошибка при обновлении связей");
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Настройки связей</CardTitle>
        <CardDescription>
          Выберите Коннекторы (теги), которые это Ядро должно объединять. 
          Узлы с этими тегами автоматически станут частью его орбиты.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h4 className="text-sm font-medium leading-none">Коннекторы орбиты</h4>
          <ConnectorSelector
            value={linkedConnectorIds}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-4 border-t pt-4">
          <h4 className="text-sm font-medium leading-none">Притянутые Узлы ({linkedNodes.length})</h4>
          {linkedNodes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              С текущими тегами к этому Ядру не притянут ни один Узел.
            </p>
          ) : (
            <ul className="text-sm text-muted-foreground space-y-2 pl-2 mt-2">
              {linkedNodes.map(node => {
                const NodeIcon = Icons[node.icon as keyof typeof Icons] || Icons.Circle;
                return (
                  <li key={node.id} className="flex items-center gap-2">
                    <NodeIcon className="w-4 h-4 opacity-70" style={{ color: node.color }} />
                    <span>{node.name}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
