import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from 'lucide-react';
import { Zap } from 'lucide-react';
import { BarChart3 } from 'lucide-react';
import { Timer } from 'lucide-react';
import { Trash2 } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { Save } from 'lucide-react';
import { toast } from "sonner";
import type { NodeType } from "@/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

import {
  createNodeSchema,
  type CreateNodeFormData,
} from "../lib/createNodeSchema";
import { useNodeQuery, useUpdateNodeMutation, useDeleteNodeMutation } from "../hooks/useNodesQuery";
import { useConnectorsQuery } from "@/features/connectors/hooks/useConnectorsQuery";
import { ColorPicker } from "./ColorPicker";
import { IconPicker } from "./IconPicker";
import { NodePreview } from "./NodePreview";
import { ConnectorSelector } from "@/entities/connector/ui/ConnectorSelector";

interface EditNodeFormProps {
  nodeId: string;
}

/**
 * Форма редактирования существующего узла
 */
export function EditNodeForm({ nodeId }: EditNodeFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { data: nodeData, isLoading: isNodeLoading } = useNodeQuery(nodeId);
  const { data: connectors = {} } = useConnectorsQuery(user?.id);
  
  const updateMutation = useUpdateNodeMutation();
  const deleteMutation = useDeleteNodeMutation();

  const [nodeType, setNodeType] = useState<NodeType>("binary");

  // React Hook Form
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateNodeFormData>({
    resolver: zodResolver(createNodeSchema) as any,
    defaultValues: {
      connector_ids: [],
    },
  });

  // Инициализируем форму при загрузке данных
  useEffect(() => {
    if (nodeData) {
      setNodeType(nodeData.node_type);
      reset({
        name: nodeData.name,
        description: nodeData.description || "",
        node_type: nodeData.node_type,
        mass: nodeData.mass,
        target_value: nodeData.target_value,
        color: nodeData.color || "#8b5cf6",
        icon: nodeData.icon || "Circle",
        connector_ids: nodeData.connector_ids || [],
        is_focus_default: nodeData.is_focus_default || false,
      });
    }
  }, [nodeData, reset]);

  // Следим за значениями для предпросмотра
  const previewValues = watch();

  // Обновляем названия коннекторов
  const connectorNames = useMemo(() => {
    return Object.values(connectors)
      .filter((c) => previewValues.connector_ids?.includes(c.id))
      .map((c) => c.name);
  }, [previewValues.connector_ids, connectors]);

  // Удаление узла
  const handleDelete = async () => {
    if (!window.confirm(t("nodes.form.edit.deleteConfirm"))) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(nodeId);
      toast.success(t("nodes.form.edit.success"));
      navigate("/nodes");
    } catch (error) {
      toast.error(t("nodes.form.edit.error"));
    }
  };

  // Сохранение изменений
  const onSubmit = async (data: CreateNodeFormData) => {
    try {
      await updateMutation.mutateAsync({
        nodeId,
        updates: {
          name: data.name,
          description: data.description,
          node_type: data.node_type,
          mass: data.mass,
          target_value: data.node_type !== "binary" ? data.target_value : undefined,
          color: data.color,
          icon: data.icon,
          connector_ids: data.connector_ids,
          is_focus_default: data.is_focus_default,
        },
        userId: user?.id,
      });

      toast.success(t("nodes.form.edit.success"));
      navigate("/nodes");
    } catch (error) {
      console.error("Ошибка обновления:", error);
      toast.error(t("nodes.form.edit.error"));
    }
  };

  // Логирование ошибок валидации (для диагностики)
  const onValidationError = (errs: object) => {
    console.warn("[EditNodeForm] Ошибки валидации при сохранении:", errs);
  };

  if (isNodeLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, onValidationError)} className="w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => navigate("/nodes")}
            className="h-10 w-10 shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("nodes.form.edit.title")}</h1>
            {/* <p className="text-muted-foreground">
              Управление параметрами и типами узла
            </p> */}
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="text-destructive hover:bg-destructive/10 border-destructive/20 gap-2 w-fit"
        >
          {deleteMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          {t("nodes.form.edit.delete")}
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-8">
          {/* Название */}
          <div className="space-y-3">
            <Label htmlFor="name" className="text-base">{t("nodes.form.fields.name")}</Label>
            <Input
              id="name"
              className={cn("h-12 text-lg font-medium", errors.name && "border-destructive")}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Тип узла */}
          <div className="space-y-4">
            <Label className="text-base">{t("nodes.form.fields.type")}</Label>
            <RadioGroup
              value={nodeType}
              onValueChange={(v) => {
                const type = v as NodeType;
                setNodeType(type);
                setValue("node_type", type, { shouldDirty: true });
                if (type === "binary") setValue("target_value", undefined, { shouldDirty: true });
              }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              {[
                { id: "binary", label: t("nodes.type.binary"), icon: Zap },
                { id: "quantity", label: t("nodes.type.quantity"), icon: BarChart3 },
                { id: "duration", label: t("nodes.type.duration"), icon: Timer },
              ].map((t) => (
                <div key={t.id}>
                  <RadioGroupItem value={t.id} id={t.id} className="sr-only" />
                  <Label
                    htmlFor={t.id}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all",
                      nodeType === t.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-muted hover:border-muted-foreground/30"
                    )}
                  >
                    <t.icon className={cn("h-6 w-6", nodeType === t.id ? "text-primary" : "text-muted-foreground")} />
                    <span className="font-bold">{t.label}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Целевое значение */}
          {nodeType !== "binary" && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <Label htmlFor="target_value" className="text-base">{t("nodes.form.fields.targetValue")}</Label>
              <div className="flex gap-3">
                <Input
                  id="target_value"
                  type="number"
                  step="0.1"
                  className="h-11"
                  {...register("target_value", { valueAsNumber: true })}
                />
                <div className="flex items-center px-4 rounded-lg bg-muted text-sm font-medium">
                  {nodeType === "duration" ? t("nodes.form.fields.units.minutes") : t("nodes.form.fields.units.units")}
                </div>
              </div>
              {errors.target_value && (
                <p className="text-sm text-destructive">{errors.target_value.message}</p>
              )}
            </div>
          )}

          {/* Масса */}
          <div className="space-y-3">
            <Label htmlFor="mass" className="text-base">{t("nodes.form.fields.mass", { value: previewValues.mass?.toFixed(1) || "1.0" })}</Label>
            <Input
              id="mass"
              type="range"
              min="0.5"
              max="10"
              step="0.5"
              className="py-2"
              value={previewValues.mass || 1.0}
              onChange={(e) => setValue("mass", parseFloat(e.target.value), { shouldDirty: true })}
            />
          </div>

          {/* Коннекторы */}
          <div className="space-y-3">
            <Label className="text-base">{t("nodes.form.fields.connectors")}</Label>
            <ConnectorSelector
              value={previewValues.connector_ids || []}
              onChange={(ids) => setValue("connector_ids", ids, { shouldDirty: true, shouldValidate: true })}
            />
            {errors.connector_ids && (
              <p className="text-sm text-destructive">{errors.connector_ids.message}</p>
            )}
          </div>

          {/* Визуал */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-base">{t("nodes.form.fields.color")}</Label>
              <ColorPicker
                value={previewValues.color || "#8b5cf6"}
                onChange={(color) => setValue("color", color, { shouldDirty: true })}
              />
            </div>
            <div className="space-y-3">
              <Label className="text-base">{t("nodes.form.fields.icon")}</Label>
              <IconPicker
                value={previewValues.icon || "Circle"}
                onChange={(icon) => setValue("icon", icon, { shouldDirty: true })}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="description" className="text-base">{t("nodes.form.fields.description")}</Label>
            <Input
              id="description"
              placeholder={t("nodes.form.fields.descriptionPlaceholder")}
              {...register("description")}
            />
          </div>

          {/* Фокус по умолчанию */}
          <div className="flex items-center space-x-2 p-4 rounded-xl border border-white/5 bg-background/50">
            <Checkbox 
              id="is_focus_default" 
              checked={watch("is_focus_default")}
              onCheckedChange={(checked) => setValue("is_focus_default", checked === true, { shouldDirty: true })}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="is_focus_default"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                {t("nodes.form.fields.isFocusDefault")}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t("nodes.form.fields.isFocusDefaultDesc")}
              </p>
            </div>
          </div>
        </div>

        {/* Предпросмотр и действия */}
        <div className="lg:sticky lg:top-8 h-fit space-y-8">
          <Card className="overflow-hidden border-2 border-primary/10 shadow-xl shadow-primary/5">
            <CardContent className="p-8">
              <div className="text-sm font-bold uppercase tracking-widest text-primary/60 mb-6">{t("nodes.preview.title")}</div>
              <NodePreview
                name={previewValues.name || t("nodes.form.fields.name")}
                icon={previewValues.icon || "Circle"}
                color={previewValues.color || "#8b5cf6"}
                connectorNames={connectorNames}
                nodeType={previewValues.node_type}
                mass={previewValues.mass}
                targetValue={previewValues.target_value}
              />
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => navigate("/nodes")}
              className="flex-1 h-12"
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={updateMutation.isPending} size="lg" className="flex-1 h-12 gap-2 shadow-lg shadow-primary/20">
              {updateMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
              {updateMutation.isPending ? t("nodes.form.edit.submitting") : t("common.save")}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
