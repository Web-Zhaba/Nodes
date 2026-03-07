import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { NodeCard } from "@/features/nodes/components/NodeCard";
import { NodeCardSkeleton } from "@/features/nodes/components/NodeCardSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { WeekCalendar } from "@/features/dashboard/components/WeekCalendar";
import { DailyFocusSelector } from "@/features/dashboard/components/DailyFocusSelector";
import { useNodesQuery } from "@/features/nodes/hooks/useNodesQuery";
import { useConnectorsQuery } from "@/features/connectors/hooks/useConnectorsQuery";
import { useDailyFocusQuery, useSetDailyFocusMutation } from "@/features/nodes/hooks/useDailyFocusQuery";
import { useImpulsesQuery, useCreateImpulseMutation, useDeleteImpulseMutation, useUpdateQuantityMutation } from "@/features/nodes/hooks/useImpulsesQuery";
import { startOfDay } from "date-fns";


/**
 * Главная страница "Сегодня" (Focus Mode)
 */
export default function NodesListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  // Queries
  const { data: nodes = {}, isLoading: isNodesLoading } = useNodesQuery(user?.id);
  const { data: connectors = {}, isLoading: isConnectorsLoading } = useConnectorsQuery(user?.id);
  const { data: focusNodeIds = [], isLoading: isFocusLoading } = useDailyFocusQuery(selectedDate, user?.id);
  
  // Get node IDs for the impulses query
  const allNodeIds = useMemo(() => Object.keys(nodes), [nodes]);
  const { data: impulses = [], isLoading: isImpulsesLoading } = useImpulsesQuery(allNodeIds, selectedDate, user?.id);

  // Mutations
  const setDailyFocus = useSetDailyFocusMutation();
  const createImpulse = useCreateImpulseMutation();
  const deleteImpulse = useDeleteImpulseMutation();
  const updateQuantity = useUpdateQuantityMutation();

  // Data processing
  const nodesWithValues = useMemo(() => {
    const impulsesMap = impulses.reduce((acc, imp: any) => {
      if (!acc[imp.node_id]) acc[imp.node_id] = [];
      acc[imp.node_id].push(imp);
      return acc;
    }, {} as Record<string, any[]>);

    const result: Record<string, { isCompleted: boolean; value: number }> = {};

    Object.values(nodes).forEach(node => {
      const nodeImpulses = impulsesMap[node.id] || [];
      const totalValue = nodeImpulses.reduce((sum: number, imp: any) => sum + (imp.value || 0), 0);
      const isCompleted = node.node_type === "binary"
        ? nodeImpulses.length > 0
        : totalValue >= (node.target_value || 0);

      result[node.id] = { isCompleted, value: totalValue };
    });

    return result;
  }, [nodes, impulses]);

  const activeNodes = useMemo(() =>
    Object.values(nodes).filter(n => focusNodeIds.includes(n.id)),
    [nodes, focusNodeIds]
  );

  const isLoading = isNodesLoading || isConnectorsLoading || isFocusLoading || isImpulsesLoading;

  const handleImpulse = useCallback(async (nodeId: string, value: number) => {
    const node = nodes[nodeId];
    if (!node) return;

    try {
      if (value < 0 || (node.node_type === "binary" && value === 0)) {
        await deleteImpulse.mutateAsync({ nodeId, date: selectedDate });
      } else {
        await createImpulse.mutateAsync({ nodeId, value, date: selectedDate });
      }
    } catch (error) {
      console.error("Ошибка сохранения импульса:", error);
      toast.error("Ошибка сохранения");
    }
  }, [nodes, selectedDate, createImpulse, deleteImpulse]);

  const handleUpdateQuantity = useCallback(async (nodeId: string, value: number) => {
    try {
      await updateQuantity.mutateAsync({ nodeId, value, date: selectedDate });
    } catch (error) {
      console.error("Ошибка обновления значения:", error);
      toast.error("Ошибка сохранения");
    }
  }, [selectedDate, updateQuantity]);

  const handleSaveFocusNodes = async (selectedIds: string[]) => {
    try {
      await setDailyFocus.mutateAsync({ nodeIds: selectedIds, date: selectedDate, userId: user?.id });
      toast.success("Фокус дня обновлен");
    } catch (error) {
      console.error("Ошибка сохранения фокуса:", error);
      toast.error("Не удалось сохранить");
    }
  };

  const isPastDate = useMemo(() =>
    selectedDate < startOfDay(new Date()),
    [selectedDate]
  );

  return (
    <div className="w-full max-w-5xl mx-auto px-4 pt-8 pb-24 md:pb-12 space-y-8 min-h-[calc(100vh-4rem)] relative">
      {/* Декоративный фон: сетка и "сияние" ядра */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-40 mix-blend-screen"
          style={{
            background: "radial-gradient(ellipse at center, var(--primary) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="space-y-6 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-foreground via-foreground to-foreground/50">
              {isPastDate ? "Архив" : (selectedDate > startOfDay(new Date()) ? "План" : "Сегодня")}
            </h1>
            <p className="text-xs sm:text-sm font-bold uppercase tracking-widest flex items-center gap-1.5 mt-1 opacity-80 text-primary">
              <Sparkles className="w-3.5 h-3.5" />
              {isPastDate ? "История орбиты" : "Режим фокуса"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/nodes/new")}
              className="flex-1 sm:flex-none gap-2 shadow-sm border-white/10 h-10 sm:h-11 rounded-xl"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden xs:inline">Узел</span>
              <span className="xs:hidden">Создать</span>
            </Button>
            <Button
              onClick={() => setIsSelectorOpen(true)}
              className="flex-[2] sm:flex-none gap-2 shadow-lg shadow-primary/20 h-10 sm:h-11 rounded-xl bg-primary hover:bg-primary/90 transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" />
              Настроить фокус
            </Button>
          </div>
        </div>

        <WeekCalendar
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-primary/80 font-medium leading-relaxed">
            {isPastDate
              ? "Режим просмотра истории. Вы можете отслеживать активности в прошлом."
              : activeNodes.length === 0
                ? "Система в ожидании. Настройте фокус для старта."
                : "Отличный темп. Система работает стабильно. Сохраняйте фокус."}
          </p>
        </div>
      </div>

      <DailyFocusSelector
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        date={selectedDate}
        allNodes={Object.values(nodes)}
        currentFocusIds={focusNodeIds}
        onSave={handleSaveFocusNodes}
      />

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <NodeCardSkeleton key={i} />
          ))}
        </div>
      ) : activeNodes.length === 0 ? (
        <div className="relative text-center py-20 mt-10 rounded-[2rem] border border-white/5 bg-background/40 backdrop-blur-xl shadow-2xl overflow-hidden group">
          <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full transition-opacity group-hover:opacity-70 opacity-40" />
          <div className="relative z-10 w-24 h-24 mx-auto mb-6 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_0_40px_rgba(var(--primary),0.15)] group-hover:scale-105 transition-transform duration-500">
            <Sparkles className="w-10 h-10 text-primary animate-pulse" />
          </div>
          <h2 className="relative z-10 text-2xl font-bold mb-2 tracking-tight">Планов нет</h2>
          <p className="relative z-10 text-muted-foreground mb-8 max-w-sm mx-auto text-sm">
            Не назначено ни одного узла. Синхронизируйте свои задачи и определите главные векторы развития на этот день.
          </p>
          <Button
            onClick={() => setIsSelectorOpen(true)}
            className="relative z-10 rounded-xl px-8 shadow-lg shadow-primary/20 h-12 text-sm font-bold tracking-wide uppercase transition-all duration-300 hover:scale-105 active:scale-95"
          >
            Настроить фокус
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {activeNodes.map((node) => {
            const todayValue = nodesWithValues[node.id] || {
              isCompleted: false,
              value: 0,
            };

            return (
              <NodeCard
                key={node.id}
                node={node}
                isCompletedToday={todayValue.isCompleted}
                todayValue={todayValue.value}
                connectors={Object.values(connectors)}
                onImpulse={(value) => handleImpulse(node.id, value)}
                onUpdateQuantity={(value) =>
                  handleUpdateQuantity(node.id, value)
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
