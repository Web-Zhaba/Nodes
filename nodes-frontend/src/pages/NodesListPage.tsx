import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Target, Activity, Coffee } from "lucide-react";
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
import { useImpulsesQuery, useRecordPulseMutation } from "@/features/nodes/hooks/useImpulsesQuery";
import { startOfDay, format } from "date-fns";
import { calculateStability } from "@/lib/api/stability";
import { useTranslation } from "react-i18next";
import type { Impulse } from "@/types";

import { useProfileQuery } from "@/features/profile/hooks/useProfileQuery";

/**
 * Главная страница "Сегодня" (Focus Mode)
 */
export default function NodesListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfileQuery(user?.id);
  const { t } = useTranslation();
  
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  // Профилировщик для замеров
  const perfRef = useRef<{ clickStart: number }>({ clickStart: 0 });

  // Полный пересчет стабильности при загрузке страницы (фоновый, не блокирует UI)
  useEffect(() => {
    if (user?.id) {
      const lastRecalc = localStorage.getItem(`last_stability_recalc_${user.id}`);
      const now = Date.now();
      
      // Пересчитываем только если прошло более 5 минут с последнего раза
      if (!lastRecalc || now - parseInt(lastRecalc) > 1000 * 60 * 5) {
        calculateStability().then(res => {
          if (res.success) {
            console.log('[INIT] Full stability recalc complete');
            localStorage.setItem(`last_stability_recalc_${user.id}`, now.toString());
          }
        });
      }
    }
  }, [user?.id]);

  // Хранит ключи дат, которые уже были инициализированы в этой сессии
  const initializedDays = useRef<Set<string>>(new Set());


  // Queries
  const { data: nodes = {}, isLoading: isNodesLoading } = useNodesQuery(user?.id);
  const { data: connectors = {}, isLoading: isConnectorsLoading } = useConnectorsQuery(user?.id);
  const { data: focusNodeIds = [], isLoading: isFocusLoading } = useDailyFocusQuery(selectedDate, user?.id);
  
  // Get node IDs for the impulses query
  const allNodeIds = useMemo(() => Object.keys(nodes), [nodes]);
  const { data: impulses = [], isLoading: isImpulsesLoading } = useImpulsesQuery(allNodeIds, selectedDate, user?.id);

  // Mutations
  const setDailyFocus = useSetDailyFocusMutation();
  const recordPulse = useRecordPulseMutation();

  // Data processing
  const nodesWithValues = useMemo(() => {
    const impulsesMap = impulses.reduce((acc, imp: Impulse) => {
      if (!acc[imp.node_id]) acc[imp.node_id] = [];
      acc[imp.node_id].push(imp);
      return acc;
    }, {} as Record<string, Impulse[]>);

    const result: Record<string, { isCompleted: boolean; value: number }> = {};

    Object.values(nodes).forEach(node => {
      const nodeImpulses = impulsesMap[node.id] || [];
      const totalValue = nodeImpulses.reduce((sum: number, imp: Impulse) => sum + (imp.value || 0), 0);
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
    perfRef.current.clickStart = performance.now();
    const node = nodes[nodeId];
    if (!node) return;

    // Оптимистичный UI мгновенно обновит галочку и ПОЛОСКУ.
    // Не ждем ответа, запускаем в фоне.
    recordPulse.mutate({ nodeId, value, date: selectedDate });
    
    console.log(`[FRONTEND] Action triggered instantly for ${nodeId}`);
  }, [nodes, selectedDate, recordPulse]);

  const handleUpdateQuantity = useCallback(async (nodeId: string, value: number) => {
    perfRef.current.clickStart = performance.now();
    // Ждем старта мутации, чтобы локальный стейт компонента не сбросился раньше времени
    await recordPulse.mutateAsync({ nodeId, value, date: selectedDate });
    console.log(`[FRONTEND] Quantity update completed for ${nodeId}`);
  }, [selectedDate, recordPulse]);

  const handleSaveFocusNodes = async (selectedIds: string[]) => {
    try {
      await setDailyFocus.mutateAsync({ nodeIds: selectedIds, date: selectedDate, userId: user?.id });
      toast.success(t("dashboard.notifications.focusUpdated", "Фокус дня обновлен"));
    } catch (error) {
      console.error("Ошибка сохранения фокуса:", error);
      toast.error(t("common.errorSaving", "Не удалось сохранить"));
    }
  };

  const isPastDate = useMemo(() =>
    selectedDate < startOfDay(new Date()),
    [selectedDate]
  );

  const greetingText = useMemo(() => {
    if (profile?.show_greeting === false) return null;
    
    const name = profile?.display_name || t("dashboard.operator", "Аноним");
    const customGreeting = profile?.custom_greeting;

    if (customGreeting) {
      // Поддерживаем оба формата: {name} и {{name}} для гибкости
      return customGreeting.replace(/{{name}}|{name}/g, name);
    }

    return t("dashboard.greeting", { name });
  }, [profile, t]);

  // Автоматическое добавление дефолтных узлов для новых дней
  useEffect(() => {
    if (isLoading || isPastDate || focusNodeIds.length > 0 || !user?.id) return;
    
    // Проверяем, есть ли вообще дефолтные узлы
    const defaultNodes = Object.values(nodes).filter(n => n.is_focus_default);
    if (defaultNodes.length === 0) return;

    const dateKey = format(selectedDate, "yyyy-MM-dd");
    const lsKey = `focus_init_${user.id}_${dateKey}`;
    
    // Если для этой даты фокус еще не инициализировался (ни в этой сессии, ни в localStorage)
    if (!initializedDays.current.has(dateKey) && !localStorage.getItem(lsKey)) {
      initializedDays.current.add(dateKey);
      localStorage.setItem(lsKey, "true");
      
      const defaultIds = defaultNodes.map(n => n.id);
      console.log(`[FRONTEND] Auto-populating ${defaultIds.length} default focus nodes for ${dateKey}`);
      
      // Вызываем мутацию для сохранения
      setDailyFocus.mutate({ nodeIds: defaultIds, date: selectedDate, userId: user.id });
    }
  }, [isLoading, isPastDate, focusNodeIds.length, nodes, selectedDate, user?.id, setDailyFocus]);

  const isFutureDate = selectedDate > startOfDay(new Date());

  const getHeaderText = () => {
    if (isPastDate) return t("dashboard.states.archive", "Архив");
    if (isFutureDate) return t("dashboard.states.plan", "План");
    return t("dashboard.states.today", "Сегодня");
  };

  const getSubText = () => {
    if (isPastDate) return t("dashboard.subtitles.history", "История орбиты");
    return t("dashboard.subtitles.focus", "Режим фокуса");
  };

  const getStatusMessage = () => {
    if (isPastDate) return t("dashboard.messages.history", "Режим просмотра истории. Вы можете отслеживать активности в прошлом.");
    if (activeNodes.length === 0) return t("dashboard.messages.waiting", "Система в ожидании. Настройте фокус для старта.");
    return t("dashboard.messages.active", "Отличный темп. Система работает стабильно. Сохраняйте фокус.");
  };

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
            {greetingText && (
              <p className="text-xs font-medium text-muted-foreground mb-1">
                {greetingText}
              </p>
            )}
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-foreground via-foreground to-foreground/50">
              {getHeaderText()}
            </h1>
            <p className="text-xs sm:text-sm font-bold uppercase tracking-widest flex items-center gap-1.5 mt-1 opacity-80 text-primary">
              <Target className="w-3.5 h-3.5" />
              {getSubText()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/nodes/new")}
              className="flex-1 sm:flex-none gap-2 shadow-sm border-white/10 h-10 sm:h-11 rounded-xl"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden xs:inline">{t("dashboard.buttons.createNode", "Узел")}</span>
              <span className="xs:hidden">{t("dashboard.buttons.create", "Создать")}</span>
            </Button>
            <Button
              onClick={() => setIsSelectorOpen(true)}
              className="flex-[2] sm:flex-none gap-2 shadow-lg shadow-primary/20 h-10 sm:h-11 rounded-xl bg-primary hover:bg-primary/90 transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" />
              {t("dashboard.buttons.setupFocus", "Настроить фокус")}
            </Button>
          </div>
        </div>

        <WeekCalendar
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          weekStartsOn={profile?.first_day_of_week as 0 | 1 | 2 | 3 | 4 | 5 | 6}
        />

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-start gap-3">
          <Activity className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-primary/80 font-medium leading-relaxed">
            {getStatusMessage()}
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
            <Coffee className="w-10 h-10 text-primary opacity-60" />
          </div>
          <h2 className="relative z-10 text-2xl font-bold mb-2 tracking-tight">{t("dashboard.empty.title", "Планов нет")}</h2>
          <p className="relative z-10 text-muted-foreground mb-8 max-w-sm mx-auto text-sm">
            {t("dashboard.empty.description", "Не назначено ни одного узла. Определите главные векторы развития на этот день.")}
          </p>
          <Button
            onClick={() => setIsSelectorOpen(true)}
            className="relative z-10 rounded-xl px-8 shadow-lg shadow-primary/20 h-12 text-sm font-bold tracking-wide uppercase transition-all duration-300 hover:scale-105 active:scale-95"
          >
            {t("dashboard.empty.setup", "Настроить фокус")}
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
                onUpdateQuantity={(value) => handleUpdateQuantity(node.id, value)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
