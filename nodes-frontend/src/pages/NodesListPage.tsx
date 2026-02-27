import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { NodeCard } from "@/features/nodes/components/NodeCard";
import { NodeCardSkeleton } from "@/features/nodes/components/NodeCardSkeleton";
import { WeekCalendar } from "@/features/dashboard/components/WeekCalendar";
import { CapacityBar } from "@/features/dashboard/components/CapacityBar";
import { DailyFocusSelector } from "@/features/dashboard/components/DailyFocusSelector";
import {
  getUserNodes,
  createImpulse,
  updateQuantityValue,
  getDailyFocusNodeIds,
  setDailyFocusNodes,
  getImpulsesForDateBatch
} from "@/features/nodes/nodeService";
import { getUserConnectors } from "@/features/connectors/connectorService";
import { useNodesStore } from "@/store/useNodesStore";
import { startOfDay } from "date-fns";
import type { Connector } from "@/types";

/**
 * Главная страница "Сегодня" (Focus Mode)
 */
export default function NodesListPage() {
  const navigate = useNavigate();
  const { nodes, setNodes, todayValues, setBatchTodayValues, setTodayValues } = useNodesStore();
  const [isLoading, setIsLoading] = useState(true);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [focusNodeIds, setFocusNodeIds] = useState<string[]>([]);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  useEffect(() => {
    loadDataForDate(selectedDate);
  }, [selectedDate]);

  const loadDataForDate = async (date: Date) => {
    setIsLoading(true);
    try {
      // 1. Загружаем все узлы и коннекторы (параллельно для скорости)
      const [nodesData, connectorsData] = await Promise.all([
        getUserNodes(),
        connectors.length === 0 ? getUserConnectors() : Promise.resolve(connectors)
      ]);

      // 2. Получаем ID узлов фокуса и импульсы (параллельно)
      const [focusIds, allImpulses] = await Promise.all([
        getDailyFocusNodeIds(date),
        getImpulsesForDateBatch(nodesData.map(n => n.id), date)
      ]);

      const impulsesMap = allImpulses.reduce((acc, imp: any) => {
        if (!acc[imp.node_id]) acc[imp.node_id] = [];
        acc[imp.node_id].push(imp);
        return acc;
      }, {} as Record<string, any[]>);

      const valuesToSet: Record<string, { isCompleted: boolean; value: number }> = {};

      nodesData.forEach(node => {
        const nodeImpulses = impulsesMap[node.id] || [];
        const totalValue = nodeImpulses.reduce((sum: number, imp: any) => sum + (imp.value || 0), 0);
        const isCompleted = node.node_type === "binary"
          ? nodeImpulses.length > 0
          : totalValue >= (node.target_value || 0);

        valuesToSet[node.id] = { isCompleted, value: totalValue };
      });

      // 3. Обновляем состояние в один этап, чтобы избежать мерцания
      setNodes(nodesData);
      if (connectors.length === 0) setConnectors(connectorsData);
      setFocusNodeIds(focusIds);
      setBatchTodayValues(valuesToSet);
    } catch (error) {
      console.error("Ошибка загрузки:", error);
      toast.error("Не удалось загрузить данные", { description: "Попробуйте позже" });
    } finally {
      setIsLoading(false);
    }
  };

  // Удаляем loadImpulsesForDate так как теперь используем батч

  const handleImpulse = useCallback(async (nodeId: string, value: number) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    try {
      // Сохраняем импульс именно на selectedDate
      const success = await createImpulse(nodeId, value, selectedDate);

      if (success) {
        // Получаем актуальные данные из БД, чтобы обновить completion_count и прогресс
        const [updatedNodes, allImpulses] = await Promise.all([
          getUserNodes(),
          getImpulsesForDateBatch([nodeId], selectedDate)
        ]);

        const nodeImpulses = allImpulses || [];
        const totalValue = nodeImpulses.reduce((sum: number, imp: any) => sum + (imp.value || 0), 0);

        const isCompleted = node.node_type === "binary"
          ? true
          : totalValue >= (node.target_value || 0);

        setNodes(updatedNodes);
        setTodayValues(nodeId, isCompleted, totalValue);
      }
    } catch (error) {
      console.error("Ошибка создания импульса:", error);
      toast.error("Ошибка сохранения");
    }
  }, [nodes, selectedDate, setNodes, setTodayValues]);

  const handleUpdateQuantity = useCallback(async (nodeId: string, value: number) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    try {
      const success = await updateQuantityValue(nodeId, value, selectedDate);

      if (success) {
        const isCompleted = value >= (node.target_value || 0);
        setTodayValues(nodeId, isCompleted, value);
      }
    } catch (error) {
      console.error("Ошибка обновления значения:", error);
      toast.error("Ошибка сохранения");
    }
  }, [nodes, selectedDate, setTodayValues]);

  const handleSaveFocusNodes = async (selectedIds: string[]) => {
    const objCurrentDate = selectedDate;
    const success = await setDailyFocusNodes(selectedIds, objCurrentDate);
    if (success) {
      setFocusNodeIds(selectedIds);
      toast.success("Фокус на день обновлен!");
    } else {
      toast.error("Не удалось обновить список задач.");
    }
  };

  // Мемоизируем производные данные, чтобы не пересчитывать их при каждом рендере
  const activeNodes = useMemo(() =>
    nodes.filter(n => focusNodeIds.includes(n.id)),
    [nodes, focusNodeIds]
  );

  const currentMass = useMemo(() =>
    activeNodes.reduce((sum, node) => sum + (node.mass || 1), 0),
    [activeNodes]
  );

  const isPastDate = useMemo(() =>
    selectedDate < startOfDay(new Date()),
    [selectedDate]
  );

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-8 min-h-screen">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Сегодня</h1>
            <p className="text-muted-foreground mt-1">
              Сфокусируйтесь на самом важном
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/nodes/new")} className="gap-2 shadow-sm hidden sm:flex border-white/10">
              <Plus className="w-4 h-4" />
              Создать узел
            </Button>
            <Button onClick={() => setIsSelectorOpen(true)} className="gap-2 shadow-sm">
              <Plus className="w-5 h-5" />
              Настроить фокус
            </Button>
          </div>
        </div>

        <WeekCalendar
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />

        <CapacityBar currentMass={currentMass} maxCapacity={10} />

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-primary/80 font-medium leading-relaxed">
            {isPastDate
              ? "Режим просмотра истории. Вы можете отслеживать активности в прошлом."
              : "Отличный темп. Система работает стабильно. Сохраняйте фокус."}
          </p>
        </div>
      </div>

      <DailyFocusSelector
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        date={selectedDate}
        allNodes={nodes}
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
        <div className="text-center py-20 mt-10">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Sparkles className="w-12 h-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">На этот день нет задач</h2>
          <p className="text-muted-foreground mb-4">
            Настройте свой фокус, выбрав узлы из вашей сети.
          </p>
          <Button onClick={() => setIsSelectorOpen(true)}>Настроить день</Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {activeNodes.map((node) => {
            const todayValue = todayValues[node.id] || {
              isCompleted: false,
              value: 0,
            };

            return (
              <NodeCard
                key={node.id}
                node={node}
                isCompletedToday={todayValue.isCompleted}
                todayValue={todayValue.value}
                connectors={connectors}
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
