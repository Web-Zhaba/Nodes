import { useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import Pencil from "lucide-react/dist/esm/icons/pencil";
import Network from "lucide-react/dist/esm/icons/network";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { CreateCoreForm } from "@/features/core-management/components/CreateCoreForm";
import { EditCoreForm } from "@/features/core-management/components/EditCoreForm";
import { CoreMocManager } from "@/features/core-management/components/CoreMocManager";
import { useCoresQuery, useCoreConnectorsQuery } from "@/features/core-management/hooks/useCoresQuery";
import { useNodesQuery } from "@/features/nodes/hooks/useNodesQuery";
import type { Impulse } from "@/types";
import { useConnectorsQuery } from "@/features/connectors/hooks/useConnectorsQuery";
import { useGraphData } from "@/features/graph-visualization/hooks/useGraphData";
import { GraphCommandCenter } from "@/features/graph-visualization/components/GraphCommandCenter";

import { startOfDay } from "date-fns";
import { useImpulsesQuery, useRecordPulseMutation } from "@/features/nodes/hooks/useImpulsesQuery";
import { NodeCard } from "@/features/nodes/components/NodeCard";

export default function GraphPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Queries
  const { data: cores = {}, isLoading: isCoresLoading } = useCoresQuery(user?.id);
  const { data: coreConnectors = {}, isLoading: isCoreConnectorsLoading } = useCoreConnectorsQuery(user?.id);
  const { data: nodes = {}, isLoading: isNodesLoading } = useNodesQuery(user?.id);
  const { data: connectors = {}, isLoading: isConnectorsLoading } = useConnectorsQuery(user?.id);
  const { graphData } = useGraphData(user?.id);

  const isLoading = isCoresLoading || isCoreConnectorsLoading || isNodesLoading || isConnectorsLoading;

  // Impulse recording logic
  const selectedDate = startOfDay(new Date());
  const recordPulse = useRecordPulseMutation();

  const handleImpulse = useCallback(async (nodeId: string, value: number) => {
    recordPulse.mutate({ nodeId, value, date: selectedDate });
  }, [selectedDate, recordPulse]);

  const handleUpdateQuantity = useCallback(async (nodeId: string, value: number) => {
    await recordPulse.mutateAsync({ nodeId, value, date: selectedDate });
  }, [selectedDate, recordPulse]);
  
  const NodeCardWrapper = ({ nodeId }: { nodeId: string }) => {
    const node = nodes[nodeId];
    const { data: nodeImpulses = [] } = useImpulsesQuery([nodeId], selectedDate, user?.id);
    
    if (!node) return null;

    const todayValue = nodeImpulses.reduce((sum: number, imp: Impulse) => sum + (imp.value || 0), 0);
    const isCompletedToday = node.node_type === "binary"
      ? nodeImpulses.length > 0
      : todayValue >= (node.target_value || 0);

    return (
      <NodeCard
        node={node}
        isCompletedToday={isCompletedToday}
        todayValue={todayValue}
        connectors={Object.values(connectors)}
        onImpulse={(value) => handleImpulse(nodeId, value)}
        onUpdateQuantity={(value) => handleUpdateQuantity(nodeId, value)}
      />
    );
  };

  const nodesList = useMemo(() => 
    Object.values(nodes).map(n => ({
      id: n.id,
      name: n.name,
      node_type: n.node_type,
      color: n.color,
      icon: n.icon,
      stability_score: n.stability_score || 0,
      share_token: n.share_token
    })), [nodes]);

  const coresList = useMemo(() => 
    Object.values(cores).map(c => ({
      id: c.id,
      name: c.name,
      color: c.color,
      icon: c.icon,
      stability_score: c.stability_score || 0,
      description: c.description
    })), [cores]);

  if (isLoading) {
    return (
      <div className="w-full h-[calc(100vh-5rem)] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <p className="text-muted-foreground">{t("graph.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "w-full max-w-7xl mx-auto flex flex-col relative gap-4 p-4",
      "h-[calc(100vh-6rem)] md:h-[calc(100vh-4rem)] pb-24 md:pb-4"
    )}>
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            {t("graph.category")}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-foreground via-foreground to-foreground/50">
            {t("graph.title")}
          </h1>
          <p className="text-xs sm:text-sm font-bold uppercase tracking-widest flex items-center gap-1.5 mt-1 opacity-80 text-primary">
            <Network className="w-3.5 h-3.5" />
            {t("graph.subtitle")}
          </p>
        </div>
      </header>

      {/* Main Area: Integrated Graph + Command Center */}
      <div className="flex-1 rounded-[2.5rem] md:rounded-3xl border border-primary/10 overflow-hidden relative bg-background/50 backdrop-blur-sm shadow-inner min-h-0">
        <GraphCommandCenter
          graphData={graphData}
          nodes={nodesList}
          cores={coresList}
          nodesMap={nodes}
          coresMap={cores}
          coreConnectors={coreConnectors}
          connectors={connectors}
          isCreating={isCreating}
          isEditing={isEditing}
          onToggleCreating={setIsCreating}
          onToggleEditing={setIsEditing}
          renderNodeCard={(nodeId) => <NodeCardWrapper nodeId={nodeId} />}
          renderCoreActions={() => (
            <div className="flex items-center gap-1 shrink-0 bg-background/50 backdrop-blur-md p-1 rounded-2xl shadow-sm border border-white/5">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-foreground transition-all rounded-xl hover:bg-muted" 
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="w-4 h-4" />
              </Button>
            </div>
          )}
          renderCreateForm={() => (
            <CreateCoreForm 
              onSuccess={() => {
                setIsCreating(false);
              }} 
              onCancel={() => setIsCreating(false)}
            />
          )}
          renderEditForm={(coreId) => (
            <EditCoreForm 
              core={cores[coreId]} 
              onSuccess={() => setIsEditing(false)}
              onDelete={() => {
                setIsEditing(false);
              }}
            />
          )}
          renderExtraContent={(_nodeId, coreId) => (
            <>
              {coreId && (
                <div className="mt-6 pt-6 border-t border-border/40">
                  <CoreMocManager coreId={coreId} />
                </div>
              )}
            </>
          )}
        />
      </div>
    </div>
  );
}
