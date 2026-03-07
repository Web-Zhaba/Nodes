import { useState } from "react";
import { cn } from "@/lib/utils";
import { Sparkles, Settings2, Plus, Pencil, ArrowLeft } from "lucide-react";
import { Icons } from "@/lib/icons";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export default function GraphPage() {
  const { user } = useAuth();
  const [selectedCoreId, setSelectedCoreId] = useState<string | null>(null);
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

  const isMobile = useMediaQuery("(max-width: 768px)");
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

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
    <div className="flex flex-col gap-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] h-full pt-8 md:pt-0">
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
              setSelectedCoreId(newCoreId);
              if (isMobile) setIsMobileSheetOpen(true);
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
                  if (isMobile) setIsMobileSheetOpen(false);
                }}
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 rounded-[2rem] border bg-gradient-to-br from-card to-muted/20 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: selectedCore.color }} />
                
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 truncate">
                    {(() => {
                      const TopIcon = Icons[selectedCore.icon as keyof typeof Icons] || Icons.Circle;
                      return <TopIcon className="w-6 h-6 shrink-0" style={{ color: selectedCore.color }} />;
                    })()}
                    <h4 className="text-2xl font-bold tracking-tight truncate">
                      {selectedCore.name}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 text-muted-foreground hover:text-foreground opacity-50 hover:opacity-100 transition-all rounded-full hover:bg-muted" 
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
                      className="h-9 w-9 text-muted-foreground hover:text-foreground transition-all rounded-full hover:bg-muted"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                <div className="pl-8">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">Центр гравитации вашей системы</p>
                </div>
              </div>
              <CoreMocManager coreId={selectedCore.id} />
            </div>
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
            <Button onClick={() => isMobile ? setIsMobileSheetOpen(true) : setIsCreating(true)} variant="outline" className="mt-4">
              Создать первое Ядро
            </Button>
          </div>
        ) : (
          <ForceGraph 
            graphData={graphData} 
            onNodeClick={(nodeId, kind) => {
              if (kind === "core") {
                setSelectedCoreId(nodeId);
                setIsCreating(false);
                setIsEditing(false);
                if (isMobile) setIsMobileSheetOpen(true);
              }
            }}
          />
        )}
        
        {/* Мобильная кнопка управления */}
        <div className="absolute bottom-6 right-6 md:hidden">
          <Button 
            size="icon" 
            className="w-14 h-14 rounded-full shadow-2xl shadow-primary/40 active:scale-90 transition-transform"
            onClick={() => setIsMobileSheetOpen(true)}
          >
            <Settings2 className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Десктопная правая панель */}
      {!isMobile && (
        <div className="w-96 hidden md:flex flex-col h-full overflow-hidden">
          {SidebarContent}
        </div>
      )}

      {/* Мобильная выдвижная панель */}
      <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-[2.5rem] p-6 border-t-primary/20">
          <SheetHeader className="hidden">
            <SheetTitle>Управление архитектурой</SheetTitle>
          </SheetHeader>
          {SidebarContent}
        </SheetContent>
      </Sheet>
    </div>
  );
}
