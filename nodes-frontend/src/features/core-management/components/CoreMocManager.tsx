import { getNodesForCore } from "@/entities/core/model/coreSelectors";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { useCoreConnectorsQuery, useToggleCoreConnectorMutation } from "@/features/core-management/hooks/useCoresQuery";
import { useNodesQuery } from "@/features/nodes/hooks/useNodesQuery";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConnectorSelector } from "@/entities/connector/ui/ConnectorSelector";
import { useTranslation } from "react-i18next";

interface CoreMocManagerProps {
  coreId: string;
}

export function CoreMocManager({ coreId }: CoreMocManagerProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const { data: coreConnectors = {} } = useCoreConnectorsQuery(user?.id);
  const { data: nodes = {} } = useNodesQuery(user?.id);
  
  const toggleMutation = useToggleCoreConnectorMutation();
  
  // Get nodes that are semantically linked to this core
  // We re-use getNodesForCore selector by passing a mock state
  const linkedNodes = getNodesForCore(nodes, coreConnectors, coreId);

  const linkedConnectorIds = Object.values(coreConnectors)
    .filter((cc) => cc.core_id === coreId)
    .map((cc) => cc.connector_id);

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
    } catch {
      toast.error(t("graph.cores.manager.updateError"));
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t("graph.cores.manager.title")}</CardTitle>
        <CardDescription>
          {t("graph.cores.manager.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h4 className="text-sm font-medium leading-none">{t("graph.cores.manager.orbitConnectors")}</h4>
          <ConnectorSelector
            value={linkedConnectorIds}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-4 border-t pt-4">
          <h4 className="text-sm font-medium leading-none">{t("graph.cores.manager.attractedNodes", { count: linkedNodes.length })}</h4>
          {linkedNodes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("graph.cores.manager.noNodes")}
            </p>
          ) : (
            <ul className="text-sm text-muted-foreground space-y-2 pl-2 mt-2">
              {linkedNodes.map(node => {

                return (
                  <li key={node.id} className="flex items-center gap-2">
                    <DynamicIcon name={node.icon || "circle"} className="w-4 h-4 opacity-70" style={{ color: node.color }} />
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
