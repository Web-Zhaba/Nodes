import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Binary, Hash, Timer, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNodesQuery, useCreateNodeMutation, useUpdateNodeMutation } from "@/features/nodes/hooks/useNodesQuery";
import { useCreateCoreMutation } from "@/features/core-management/hooks/useCoresQuery";
import { useRecordPulseMutation } from "@/features/nodes/hooks/useImpulsesQuery";
import { NodePreview } from "@/features/nodes/components/NodePreview";
import { NodeCard } from "@/features/nodes/components/NodeCard";
import { useOnboardingStore } from "../useOnboardingStore";
import type { NodeType } from "@/types";

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const TYPE_ICONS: Record<NodeType, typeof Binary> = {
  binary: Binary,
  quantity: Hash,
  duration: Timer,
};

export function WelcomeStep() {
  const { t } = useTranslation();
  const { nextStep, close } = useOnboardingStore();

  return (
    <div className="flex flex-col items-center justify-center text-center py-4">
      <div className="relative mb-5">
        <div className="w-24 h-24 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_0_60px_rgba(var(--primary),0.2)]">
          <Sparkles className="w-12 h-12 text-primary" />
        </div>
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary animate-pulse shadow-lg shadow-primary/50" />
      </div>
      <h2 className="text-3xl font-bold tracking-tighter mb-2">
        {t("onboarding.welcome.title")}
      </h2>
      <p className="text-muted-foreground max-w-sm mb-4 text-sm leading-relaxed">
        {t("onboarding.welcome.subtitle")}
      </p>

      <div className="grid grid-cols-3 gap-3 mb-6 w-full max-w-xs">
        <div className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-primary/5 border border-primary/10">
          <Circle className="w-5 h-5 text-primary" />
          <span className="text-[10px] font-medium text-muted-foreground">Node</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-primary/5 border border-primary/10">
          <Zap className="w-5 h-5 text-primary" />
          <span className="text-[10px] font-medium text-muted-foreground">Impulse</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-primary/5 border border-primary/10">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="text-[10px] font-medium text-muted-foreground">Core</span>
        </div>
      </div>

      <div className="flex gap-3 w-full max-w-xs">
        <Button variant="outline" className="flex-1" onClick={close}>
          {t("onboarding.skip")}
        </Button>
        <Button className="flex-[2] shadow-lg shadow-primary/20" onClick={nextStep}>
          {t("onboarding.welcome.start")}
        </Button>
      </div>
    </div>
  );
}

function Circle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="6" />
    </svg>
  );
}

export function CreateNodeStep() {
  const { t } = useTranslation();
  const { nextStep, close, setCreatedNodeId } = useOnboardingStore();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [nodeType, setNodeType] = useState<NodeType>("binary");
  const [targetValue, setTargetValue] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const createNode = useCreateNodeMutation();

  const handleCreate = async () => {
    if (!name.trim()) return;
    setIsCreating(true);
    try {
      const node = await createNode.mutateAsync({
        node: {
          name: name.trim(),
          node_type: nodeType,
          target_value: nodeType !== "binary" ? Number(targetValue) || undefined : undefined,
          is_focus_default: true,
        },
        userId: user?.id,
      });
      if (node) {
        setCreatedNodeId(node.id);
        nextStep();
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="py-4">
      <h2 className="text-2xl font-bold tracking-tighter mb-1">
        {t("onboarding.createNode.title")}
      </h2>
      <p className="text-muted-foreground text-sm mb-4">
        {t("onboarding.createNode.subtitle")}
      </p>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              {t("onboarding.createNode.nameLabel")}
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("onboarding.createNode.namePlaceholder")}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="h-10 rounded-xl"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">
              {t("onboarding.createNode.typeLabel")}
            </label>
            <div className="flex flex-col gap-1.5">
              {(["binary", "quantity", "duration"] as NodeType[]).map((type) => {
                const Icon = TYPE_ICONS[type];
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setNodeType(type)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-all",
                      nodeType === type
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/30"
                    )}
                  >
                    <Icon className={cn("w-3.5 h-3.5", nodeType === type ? "text-primary" : "text-muted-foreground")} />
                    <div>
                      <span className="text-xs font-medium">{t(`onboarding.createNode.type${capitalize(type)}`)}</span>
                      <span className="text-[10px] text-muted-foreground ml-1">{t(`onboarding.createNode.type${capitalize(type)}Desc`)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {nodeType !== "binary" && (
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                {t("onboarding.createNode.targetLabel")}
              </label>
              <Input
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder={t("onboarding.createNode.targetPlaceholder")}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                className="h-10 rounded-xl"
              />
            </div>
          )}
        </div>

        <div className="flex items-start justify-center">
          <NodePreview
            name={name || t("onboarding.createNode.namePlaceholder")}
            icon="Circle"
            color="#8b5cf6"
            nodeType={nodeType}
            mass={1.0}
            targetValue={nodeType !== "binary" ? (targetValue || undefined) : undefined}
            className={cn(
              "transition-all duration-300 max-w-[200px]",
              !name.trim() && "opacity-40"
            )}
          />
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <Button variant="ghost" onClick={close}>
          {t("onboarding.skip")}
        </Button>
        <div className="flex-1" />
        <Button
          onClick={handleCreate}
          disabled={!name.trim() || isCreating}
          className="shadow-lg shadow-primary/20"
        >
          {isCreating ? "..." : t("onboarding.next")}
        </Button>
      </div>
    </div>
  );
}

export function FirstImpulseStep() {
  const { t } = useTranslation();
  const { nextStep, close, createdNodeId } = useOnboardingStore();
  const { user } = useAuth();
  const { data: nodes = {} } = useNodesQuery(user?.id);
  const [isCompleted, setIsCompleted] = useState(false);
  const recordPulse = useRecordPulseMutation();

  const createdNode = createdNodeId ? nodes[createdNodeId] : null;

  const handleImpulse = async () => {
    if (!createdNodeId || isCompleted) return;
    try {
      await recordPulse.mutateAsync({
        nodeId: createdNodeId,
        value: 1,
        date: new Date(),
      });
      setIsCompleted(true);
    } catch {
      setIsCompleted(true);
    }
  };

  return (
    <div className="py-4">
      <h2 className="text-2xl font-bold tracking-tighter mb-1">
        {t("onboarding.firstImpulse.title")}
      </h2>
      <p className="text-muted-foreground text-sm mb-4">
        {t("onboarding.firstImpulse.subtitle")}
      </p>

      {createdNode ? (
        <div className="flex justify-center mb-4">
          <div className="w-full max-w-xs">
            <NodeCard
              node={createdNode}
              isCompletedToday={isCompleted}
              todayValue={isCompleted ? 1 : 0}
              connectors={[]}
              onImpulse={handleImpulse}
              className={cn(
                "transition-all duration-500",
                isCompleted && "scale-[1.02]"
              )}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center py-6">
          <button
            type="button"
            onClick={handleImpulse}
            disabled={isCompleted}
            className={cn(
              "w-24 h-24 rounded-3xl flex items-center justify-center transition-all duration-300 relative",
              isCompleted
                ? "bg-primary/20 border-2 border-primary shadow-[0_0_40px_rgba(var(--primary),0.3)] scale-105"
                : "bg-primary/10 border-2 border-primary/30 hover:scale-105 hover:shadow-lg hover:border-primary/50 active:scale-95 cursor-pointer"
            )}
          >
            <Check className={cn("w-10 h-10 text-primary transition-all duration-500", isCompleted ? "opacity-100 scale-100" : "opacity-0 scale-50")} />
            <Zap className={cn("w-10 h-10 text-primary transition-all duration-500 absolute", isCompleted ? "opacity-0 scale-50" : "opacity-100 scale-100")} />
          </button>
          <p className="text-sm text-muted-foreground mt-3">
            {isCompleted ? t("onboarding.firstImpulse.completed") : t("onboarding.firstImpulse.hint")}
          </p>
        </div>
      )}

      <div className="flex gap-3 mt-3">
        <Button variant="ghost" onClick={close}>
          {t("onboarding.skip")}
        </Button>
        <div className="flex-1" />
        <Button className="shadow-lg shadow-primary/20" onClick={nextStep}>
          {isCompleted ? t("onboarding.next") : t("onboarding.firstImpulse.skipImpulse")}
        </Button>
      </div>
    </div>
  );
}

export function CreateCoreStep() {
  const { t } = useTranslation();
  const { nextStep, close, setCreatedCoreId, createdNodeId } = useOnboardingStore();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#8b5cf6");
  const [isCreating, setIsCreating] = useState(false);
  const createCore = useCreateCoreMutation();
  const updateNode = useUpdateNodeMutation();

  const handleCreate = async () => {
    if (!name.trim() || !user?.id) return;
    setIsCreating(true);
    try {
      const core = await createCore.mutateAsync({
        userId: user.id,
        name: name.trim(),
        color,
      });
      if (core) {
        setCreatedCoreId(core.id);
        if (createdNodeId) {
          await updateNode.mutateAsync({
            nodeId: createdNodeId,
            updates: { core_id: core.id, color },
          });
        }
        nextStep();
      }
    } finally {
      setIsCreating(false);
    }
  };

  const PRESET_COLORS = ["#8b5cf6", "#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#ec4899"];

  return (
    <div className="py-4">
      <h2 className="text-2xl font-bold tracking-tighter mb-1">
        {t("onboarding.createCore.title")}
      </h2>
      <p className="text-muted-foreground text-sm mb-4">
        {t("onboarding.createCore.subtitle")}
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              {t("onboarding.createCore.nameLabel")}
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("onboarding.createCore.namePlaceholder")}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="h-10 rounded-xl"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">
              {t("onboarding.createCore.colorLabel")}
            </label>
            <div className="flex gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "w-8 h-8 rounded-full transition-all duration-200",
                    color === c
                      ? "ring-2 ring-offset-2 ring-offset-background scale-110 shadow-lg"
                      : "hover:scale-110 opacity-50 hover:opacity-100"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-3">
          <div
            className={cn(
              "w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 border-2",
              name.trim() ? "scale-100 opacity-100" : "scale-90 opacity-30"
            )}
            style={{ backgroundColor: color + "15", borderColor: color + "40", boxShadow: name.trim() ? `0 0 30px ${color}20` : "none" }}
          >
            <Sparkles className="w-8 h-8" style={{ color }} />
          </div>
          {name.trim() && (
            <span className="text-sm font-semibold" style={{ color }}>{name.trim()}</span>
          )}
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Core</span>
        </div>
      </div>

      <div className="flex gap-3 mt-5">
        <Button variant="ghost" onClick={close}>
          {t("onboarding.skip")}
        </Button>
        <div className="flex-1" />
        <Button
          onClick={handleCreate}
          disabled={!name.trim() || isCreating}
          className="shadow-lg shadow-primary/20"
        >
          {isCreating ? "..." : t("onboarding.next")}
        </Button>
      </div>
    </div>
  );
}

export function SeeGraphStep({ onComplete }: { onComplete: () => void }) {
  const { t } = useTranslation();
  const { close } = useOnboardingStore();
  const navigate = useNavigate();

  const handleFinish = () => {
    onComplete();
    close();
    navigate("/graph");
  };

  return (
    <div className="py-4">
      <h2 className="text-2xl font-bold tracking-tighter mb-1">
        {t("onboarding.seeGraph.title")}
      </h2>
      <p className="text-muted-foreground text-sm mb-5">
        {t("onboarding.seeGraph.subtitle")}
      </p>

      <div className="flex flex-col items-center py-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-primary/5 border border-primary/20 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-primary/60" />
          </div>
          <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Circle className="w-2.5 h-2.5 text-primary" />
          </div>
          <div className="absolute bottom-0 -left-3 w-4 h-4 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center">
            <Circle className="w-2 h-2 text-primary" />
          </div>
          <div className="absolute top-1/2 -right-4 w-3 h-3 rounded-full bg-primary/10 border border-primary/20" />
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 96 96">
            <line x1="48" y1="20" x2="80" y2="14" stroke="currentColor" strokeWidth="1" className="text-primary/20" />
            <line x1="36" y1="72" x2="48" y2="48" stroke="currentColor" strokeWidth="1" className="text-primary/20" />
            <line x1="48" y1="48" x2="84" y2="48" stroke="currentColor" strokeWidth="1" className="text-primary/15" />
          </svg>
        </div>
        <p className="text-sm text-muted-foreground text-center max-w-sm mt-4">
          {t("onboarding.seeGraph.graphHint")}
        </p>
      </div>

      <div className="flex gap-3 mt-4">
        <Button variant="ghost" onClick={close}>
          {t("onboarding.skip")}
        </Button>
        <div className="flex-1" />
        <Button className="shadow-lg shadow-primary/20" onClick={handleFinish}>
          {t("onboarding.finish")}
        </Button>
      </div>
    </div>
  );
}
