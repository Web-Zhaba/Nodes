import { useState } from "react";
import { cn } from "@/lib/utils";
import { Sparkles, Settings2, Plus, Pencil, ArrowLeft, X } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { CreateCoreForm } from "@/features/core-management/components/CreateCoreForm";
import { EditCoreForm } from "@/features/core-management/components/EditCoreForm";
import { CoreMocManager } from "@/features/core-management/components/CoreMocManager";
import { useCoresQuery, useCoreConnectorsQuery } from "@/features/core-management/hooks/useCoresQuery";
import { useNodesQuery } from "@/features/nodes/hooks/useNodesQuery";
import { useConnectorsQuery } from "@/features/connectors/hooks/useConnectorsQuery";
import { ForceGraph } from "@/entities/graph/ui/ForceGraph";
import { useGraphData } from "@/features/graph-visualization/hooks/useGraphData";
import { CoreSidebarCard } from "@/features/core-management/components/CoreSidebarCard";

import { useCallback } from "react";
import { startOfDay } from "date-fns";
import { useImpulsesQuery, useRecordPulseMutation } from "@/features/nodes/hooks/useImpulsesQuery";
import { NodeCard } from "@/features/nodes/components/NodeCard";

export default function GraphPage() {
  const { user } = useAuth();
  const [selectedCoreId, setSelectedCoreId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { data: cores = {}, isLoading: isCoresLoading } = useCoresQuery(user?.id);
  const { data: coreConnectors = {}, isLoading: isCoreConnectorsLoading } = useCoreConnectorsQuery(user?.id);
  const { data: nodes = {}, isLoading: isNodesLoading } = useNodesQuery(user?.id);
  const { data: connectors = {}, isLoading: isConnectorsLoading } = useConnectorsQuery(user?.id);
  const { graphData } = useGraphData(user?.id);

  const isLoading = isCoresLoading || isCoreConnectorsLoading || isNodesLoading || isConnectorsLoading;

  // Выбранное для редактирования ядро
  const selectedCore = Object.values(cores).find(c => c.id === selectedCoreId);

  // Для карточки узла
  const selectedDate = startOfDay(new Date());
  const selectedNodeIdArray = selectedNodeId ? [selectedNodeId] : [];
  const { data: nodeImpulses = [] } = useImpulsesQuery(selectedNodeIdArray, selectedDate, user?.id);

  const recordPulse = useRecordPulseMutation();

  const handleImpulse = useCallback(async (nodeId: string, value: number) => {
    recordPulse.mutate({ nodeId, value, date: selectedDate });
  }, [selectedDate, recordPulse]);

  const handleUpdateQuantity = useCallback(async (nodeId: string, value: number) => {
    await recordPulse.mutateAsync({ nodeId, value, date: selectedDate });
  }, [selectedDate, recordPulse]);

  let isCompletedToday = false;
  let todayValue = 0;
  if (selectedNodeId && nodes[selectedNodeId]) {
    const node = nodes[selectedNodeId];
    todayValue = nodeImpulses.reduce((sum: number, imp: any) => sum + (imp.value || 0), 0);
    isCompletedToday = node.node_type === "binary"
      ? nodeImpulses.length > 0
      : todayValue >= (node.target_value || 0);
  }


  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="w-full h-[calc(100vh-5rem)] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Sparkles className="w-8 h-8 text-primary opacity-50" />
          <p className="text-muted-foreground">Архитектура загружается...</p>
        </div>
      </div>
    );
  }

  // Контент управления ядрами
  const SidebarContent = (
    <div className="flex flex-col gap-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] h-full pt-4 md:pt-0">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-bold flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-primary" />
          Архитектура
        </h3>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 gap-1.5"
          onClick={() => {
            setSelectedCoreId(null);
            setSelectedNodeId(null);
            setIsEditing(false);
            setIsCreating(true);
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          Новое Ядро
        </Button>
      </div>

      {/* Список существующих ядер */}
      {!isCreating && !selectedCore && !selectedNodeId && (
        <div className="space-y-3 pb-20">
          {Object.keys(cores).length === 0 ? (
            <div className="text-center p-8 bg-muted/30 rounded-2xl border border-dashed border-muted">
              <p className="text-sm text-muted-foreground">У вас еще нет Ядер.</p>
              <Button 
                variant="link" 
                onClick={() => setIsCreating(true)}
                className="mt-2 text-primary"
              >
                Создайте первый центр гравитации
              </Button>
            </div>
          ) : (
            Object.values(cores).map(core => (
              <CoreSidebarCard
                key={core.id}
                core={core}
                nodes={nodes}
                coreConnectors={coreConnectors}
                connectors={connectors}
                isSelected={selectedCoreId === core.id}
                onClick={() => {
                  setIsCreating(false);
                  setIsEditing(false);
                  setSelectedNodeId(null);
                  setSelectedCoreId(core.id);
                }}
              />
            ))
          )}
        </div>
      )}

      {/* Форма создания Ядра */}
      {isCreating && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">

          </div>
          <CreateCoreForm 
            onSuccess={(newCoreId) => {
              setIsCreating(false);
              setSelectedNodeId(null);
              setSelectedCoreId(newCoreId);
              setIsSidebarOpen(true);
            }} 
            onCancel={() => setIsCreating(false)}
          />
          
        </div>
      )}

      {/* Настройка Ядра */}
      {selectedCore && !isCreating && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          {isEditing ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-2xl font-bold tracking-tight px-1">Настройки</h4>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsEditing(false)} 
                  className="h-9 w-9 text-muted-foreground hover:text-foreground transition-all rounded-full hover:bg-muted"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </div>
              <EditCoreForm 
                core={selectedCore} 
                onSuccess={() => setIsEditing(false)}
                onDelete={() => {
                  setIsEditing(false);
                  setSelectedCoreId(null);
                  setIsSidebarOpen(false);
                }}
              />
            </div>
          ) : (
            <div className="space-y-6">
              <CoreSidebarCard
                core={selectedCore}
                nodes={nodes}
                coreConnectors={coreConnectors}
                connectors={connectors}
                isSelected={true}
                actionButtons={
                  <div className="flex items-center gap-1 shrink-0 bg-background/50 backdrop-blur-md p-1 rounded-2xl shadow-sm border border-white/5">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-foreground transition-all rounded-xl hover:bg-muted" 
                      onClick={() => setIsEditing(true)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                        setSelectedCoreId(null);
                        setIsEditing(false);
                      }} 
                      className="h-8 w-8 text-muted-foreground hover:text-foreground transition-all rounded-xl hover:bg-muted"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                  </div>
                }
              />
              <CoreMocManager coreId={selectedCore.id} />
            </div>
          )}
        </div>
      )}

      {/* Карточка Узла */}
      {selectedNodeId && !isCreating && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="flex items-center justify-between mb-2">
                <h4 className="text-2xl font-bold tracking-tight px-1 text-primary gap-2 flex items-center">
                  <Sparkles className="w-5 h-5"/> Узел
                </h4>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setSelectedNodeId(null)} 
                  className="h-9 w-9 text-muted-foreground hover:text-foreground transition-all rounded-full hover:bg-muted"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </div>
            {nodes[selectedNodeId] && (
              <NodeCard
                node={nodes[selectedNodeId]}
                isCompletedToday={isCompletedToday}
                todayValue={todayValue}
                connectors={Object.values(connectors)}
                onImpulse={(value) => handleImpulse(selectedNodeId, value)}
                onUpdateQuantity={(value) => handleUpdateQuantity(selectedNodeId, value)}
              />
            )}
        </div>
      )}
    </div>
  );

  return (
    <div className={cn(
      "w-full flex flex-col md:flex-row relative gap-4 p-2 md:p-4",
      "h-[calc(100vh-11rem)] md:h-[calc(100vh-9rem)]" // Вычитаем высоту хедера, навбара и отступов
    )}>
      {/* Левая панель: Graph */}
      <div className="mt-12 flex-1 rounded-[2rem] md:rounded-3xl border border-primary/10 overflow-hidden relative bg-background/50 backdrop-blur-sm shadow-inner">
        {graphData.nodes.length === 0 && !isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center p-6">
            <Sparkles className="w-10 h-10 text-primary opacity-40" />
            <p className="text-muted-foreground text-sm max-w-xs">
              Пустота. Создайте Ядра, чтобы запустить нейронную сеть вашей жизни.
            </p>
            <Button onClick={() => { setIsSidebarOpen(true); setIsCreating(true); }} variant="outline" className="mt-4">
              Создать первое Ядро
            </Button>
          </div>
        ) : (
          <ForceGraph 
            graphData={graphData} 
            onNodeClick={(nodeId, kind) => {
              if (kind === "core") {
                setSelectedCoreId(nodeId);
                setSelectedNodeId(null);
                setIsCreating(false);
                setIsEditing(false);
                setIsSidebarOpen(true);
              } else if (kind === "node") {
                setSelectedNodeId(nodeId);
                setSelectedCoreId(null);
                setIsCreating(false);
                setIsEditing(false);
                setIsSidebarOpen(true);
              }
            }}
          />
        )}
        
        {/* Кнопка управления (теперь видна и на десктопе) */}
        <div className="absolute bottom-6 right-6 z-10">
          <Button 
            size="icon" 
            className="w-14 h-14 rounded-full shadow-2xl shadow-primary/40 active:scale-90 transition-transform"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Settings2 className="w-6 h-6" />
          </Button>
        </div>

        {/* Универсальный встроенный сайдбар, выезжающий из края графа */}
        <>
          {/* Легкое затемнение фона графа при открытом сайдбаре */}
          <div 
            className={cn(
              "absolute inset-0 bg-background/20 backdrop-blur-[2px] transition-all duration-500 z-20",
              isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            )}
            onClick={() => setIsSidebarOpen(false)}
          />
          {/* Сам сайдбар (выполняет роль шторки на телефонах и панели на десктопе) */}
          <div 
            className={cn(
              "absolute bg-background/95 backdrop-blur-2xl z-30 transition-all duration-500 ease-in-out flex flex-col shadow-2xl overflow-hidden",
              // Mobile styles (bottom sheet style) - height is relative to the graph container (parent)
              "bottom-0 left-0 w-full h-[92%] rounded-t-[2rem] border-t border-primary/20 p-4",
              // Desktop styles
              "md:top-0 md:bottom-0 md:left-auto md:right-0 md:w-96 md:h-full md:rounded-none md:border-t-0 md:border-l md:p-6",
              // Animations
              isSidebarOpen 
                ? "translate-y-0 md:translate-x-0" 
                : "translate-y-full md:translate-y-0 md:translate-x-full"
            )}
          >
            <div className="flex items-center justify-between mb-2 -mt-2">
              <h3 className="font-bold text-lg text-muted-foreground opacity-80 uppercase tracking-widest text-[10px]">Командный центр</h3>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsSidebarOpen(false)} 
                className="rounded-full h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto w-full -mx-4 px-4 md:-mx-6 md:px-6 relative h-full">
              {SidebarContent}
            </div>
          </div>
        </>
      </div>
    </div>
  );
}
