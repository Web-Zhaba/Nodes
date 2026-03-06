import { useState } from "react";
import { Sparkles, Settings2, Plus, Pencil } from "lucide-react";
import { Icons } from "@/lib/icons";
import { getNodesForCore } from "@/entities/core/model/coreSelectors";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { CreateCoreForm } from "@/features/core-management/components/CreateCoreForm";
import { EditCoreForm } from "@/features/core-management/components/EditCoreForm";
import { CoreMocManager } from "@/features/core-management/components/CoreMocManager";
import { Badge } from "@/components/ui/badge";
import { useCoresQuery, useCoreConnectorsQuery } from "@/features/core-management/hooks/useCoresQuery";
import { useNodesQuery } from "@/features/nodes/hooks/useNodesQuery";
import { useConnectorsQuery } from "@/features/connectors/hooks/useConnectorsQuery";
import { ForceGraph } from "@/entities/graph/ui/ForceGraph";
import { useGraphData } from "@/features/graph-visualization/hooks/useGraphData";

export default function GraphPage() {
  const { user } = useAuth();
  const [selectedCoreId, setSelectedCoreId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { data: cores = {}, isLoading: isCoresLoading } = useCoresQuery(user?.id);
  const { data: coreConnectors = {}, isLoading: isCoreConnectorsLoading } = useCoreConnectorsQuery(user?.id);
  const { data: nodes = {}, isLoading: isNodesLoading } = useNodesQuery(user?.id);
  const { isLoading: isConnectorsLoading } = useConnectorsQuery(user?.id);
  const { graphData } = useGraphData(user?.id);

  const isLoading = isCoresLoading || isCoreConnectorsLoading || isNodesLoading || isConnectorsLoading;

  // Выбранное для редактирования ядро
  const selectedCore = Object.values(cores).find(c => c.id === selectedCoreId);

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

  return (
    <div className="w-full flex flex-col md:flex-row h-[calc(100vh-5rem)] relative gap-4 p-4">
      {/* Левая панель: Force-directed graph canvas */}
      <div className="flex-1 rounded-3xl border border-primary/10 overflow-hidden relative">
        {graphData.nodes.length === 0 && !isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
            <Sparkles className="w-10 h-10 text-primary opacity-40" />
            <p className="text-muted-foreground text-sm max-w-xs">
              Создайте Ядра и привяжите к ним Узлы через Коннекторы — граф оживёт.
            </p>
          </div>
        ) : (
          <ForceGraph graphData={graphData} />
        )}
      </div>

      {/* 
        Правая панель: Manage Cores 
      */}
      <div className="w-full md:w-96 flex flex-col gap-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
              setIsEditing(false);
              setIsCreating(true);
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            Новое Ядро
          </Button>
        </div>

        {/* Список существующих ядер */}
        {!isCreating && !selectedCore && (
          <div className="space-y-3">
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
              Object.values(cores).map(core => {
                const affectedNodes = getNodesForCore(nodes, coreConnectors, core.id);
                const CoreIcon = Icons[core.icon as keyof typeof Icons] || Icons.Circle;
                return (
                  <div 
                    key={core.id} 
                    className="group relative overflow-hidden p-4 rounded-2xl border bg-card text-card-foreground hover:bg-muted/50 transition-all cursor-pointer shadow-sm hover:shadow-md hover:border-primary/50"
                    onClick={() => {
                      setIsCreating(false);
                      setIsEditing(false);
                      setSelectedCoreId(core.id);
                    }}
                    >
                      <div 
                        className="absolute top-0 left-0 w-1.5 h-full opacity-70 group-hover:opacity-100 transition-opacity" 
                        style={{ backgroundColor: core.color }}
                      />
                      <div className="ml-3">
                        <h4 className="font-bold tracking-tight text-lg flex items-center gap-2">
                          <CoreIcon className="w-5 h-5 opacity-80" />
                          {core.name}
                        </h4>
                        <div className="mt-2 space-y-2">
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3" />
                            Узлов притянуто: <Badge variant="secondary" className="px-1.5 h-5">{affectedNodes.length}</Badge>
                          </p>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                              <span>Стабильность</span>
                              <span>{core.stability_score}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-muted overflow-hidden rounded-full">
                              <div 
                                className="h-full transition-all duration-500 rounded-full" 
                                style={{ 
                                  width: `${core.stability_score}%`,
                                  backgroundColor: core.color || "var(--primary)"
                                }} 
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                )
              })
            )}
          </div>
        )}

        {/* Форма создания Ядра */}
        {isCreating && (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)} className="-ml-3 text-muted-foreground">
              ← Назад к списку
            </Button>
            <CreateCoreForm onSuccess={(newCoreId) => {
              setIsCreating(false);
              setSelectedCoreId(newCoreId);
            }} />
          </div>
        )}

        {/* Настройка Ядра (Связывание тегов) */}
        {selectedCore && !isCreating && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setSelectedCoreId(null);
                  setIsEditing(false);
                }} 
                className="-ml-3 text-muted-foreground"
              >
                ← Назад к списку
              </Button>
              {!isEditing && (
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Изменить
                </Button>
              )}
            </div>
            
            {isEditing ? (
              <EditCoreForm 
                core={selectedCore} 
                onSuccess={() => setIsEditing(false)}
                onDelete={() => {
                  setIsEditing(false);
                  setSelectedCoreId(null);
                }}
              />
            ) : (
              <>
                <div className="p-5 rounded-2xl border shadow-sm relative overflow-hidden bg-gradient-to-br from-card to-muted/20">
                  <div 
                    className="absolute top-0 left-0 w-full h-1" 
                    style={{ backgroundColor: selectedCore.color }}
                  />
                  <h4 className="text-2xl font-bold mb-1 flex items-center gap-2">
                    {(() => {
                      const TopIcon = Icons[selectedCore.icon as keyof typeof Icons] || Icons.Circle;
                      return <TopIcon className="w-6 h-6 opacity-80" />;
                    })()}
                    {selectedCore.name}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">Настройка притяжения Узлов</p>
                </div>

                {/* Менеджер тегов Ядра */}
                <CoreMocManager coreId={selectedCore.id} />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
