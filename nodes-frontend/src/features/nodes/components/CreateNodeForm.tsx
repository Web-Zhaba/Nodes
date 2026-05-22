import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from 'lucide-react';
import { Sparkles } from 'lucide-react';
import { Zap } from 'lucide-react';
import { BarChart3 } from 'lucide-react';
import { Timer } from 'lucide-react';
import { Check } from 'lucide-react';
import { toast } from "sonner";
import type { NodeType } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useNodeLimit } from "@/features/subscription/hooks/useNodeLimit";

import { cn } from "@/lib/utils";
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
import { useCreateNodeMutation } from "../hooks/useNodesQuery";
import { useConnectorsQuery } from "@/features/connectors/hooks/useConnectorsQuery";
import { ColorPicker } from "./ColorPicker";
import { IconPicker } from "./IconPicker";
import { ConnectorSelector } from "@/entities/connector/ui/ConnectorSelector";
import { NodePreview } from "./NodePreview";

/**
 * Основная форма создания узла
 */
export function CreateNodeForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canCreate, limit } = useNodeLimit();
  
  const createMutation = useCreateNodeMutation();
  const { data: connectors = {} } = useConnectorsQuery(user?.id);

  const [nodeType, setNodeType] = useState<NodeType>("binary");

  // React Hook Form с Zod валидацией
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateNodeFormData>({
    resolver: zodResolver(createNodeSchema) as any,
    defaultValues: {
      name: "",
      description: "",
      node_type: "binary",
      mass: 1.0,
      target_value: undefined,
      connector_ids: [],
      color: "#8b5cf6",
      icon: "Circle",
      is_focus_default: false,
    },
  });

  // Следим за значениями для предпросмотра
  const previewValues = watch();

  // Обновляем названия коннекторов при изменении выбранных ID
  const connectorNames = useMemo(() => {
    return Object.values(connectors)
      .filter((c) => previewValues.connector_ids?.includes(c.id))
      .map((c) => c.name);
  }, [previewValues.connector_ids, connectors]);

  // Обработка отправки формы
  const onSubmit = async (data: CreateNodeFormData) => {
    if (!canCreate) {
      toast.error(t("subscription.limit.nodes"), {
        description: t("subscription.limit.nodesDesc", { limit })
      });
      return;
    }

    try {
      // Создаём узел с коннекторами
      const newNode = await createMutation.mutateAsync({
        node: {
          name: data.name,
          description: data.description,
          node_type: data.node_type,
          mass: data.mass,
          target_value:
            data.node_type !== "binary" ? data.target_value : undefined,
          color: data.color,
          icon: data.icon,
          connector_ids: data.connector_ids,
          is_focus_default: data.is_focus_default,
        },
        userId: user?.id,
      });

      if (!newNode) {
        throw new Error(t("nodes.form.create.errorDesc"));
      }

      toast.success(t("nodes.form.create.success"), {
        description: t("nodes.form.create.successDesc", { name: newNode.name }),
      });

      // Редирект на главную
      navigate("/");
    } catch (error) {
      console.error("Ошибка создания узла:", error);
      toast.error(t("nodes.form.create.error"), {
        description:
          error instanceof Error ? error.message : t("nodes.form.create.errorDesc"),
      });
    }
  };

  // Обработка выбора типа узла
  const handleNodeTypeChange = (value: string) => {
    const type = value as NodeType;
    setNodeType(type);
    setValue("node_type", type);

    // Сбрасываем target_value для binary
    if (type === "binary") {
      setValue("target_value", undefined);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full">
      {/* Заголовок с кнопкой назад */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="h-10 w-10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t("nodes.form.create.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("nodes.form.create.subtitle")}
          </p>
        </div>
      </div>

      {/* Две колонки: форма и предпросмотр */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Левая колонка - Форма */}
        <div className="space-y-6">
          {/* Название узла */}
          <div className="space-y-2">
            <Label htmlFor="name">
              {t("nodes.form.fields.name")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder={t("nodes.form.fields.namePlaceholder")}
              className={cn(
                errors.name &&
                "border-destructive focus-visible:ring-destructive",
              )}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Тип узла */}
          <div className="space-y-2">
            <Label>
              {t("nodes.form.fields.type")} <span className="text-destructive">*</span>
            </Label>
            <RadioGroup
              value={nodeType}
              onValueChange={handleNodeTypeChange}
              className="grid grid-cols-3 gap-3"
            >
              {/* Binary */}
              <div>
                <RadioGroupItem
                  value="binary"
                  id="binary"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="binary"
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer",
                    "transition-all hover:bg-accent",
                    nodeType === "binary"
                      ? "border-primary bg-primary/10"
                      : "border-muted",
                  )}
                >
                  <Zap className="h-8 w-8" />
                  <span className="font-medium">{t("nodes.type.binary")}</span>
                </Label>
              </div>

              {/* Quantity */}
              <div>
                <RadioGroupItem
                  value="quantity"
                  id="quantity"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="quantity"
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer",
                    "transition-all hover:bg-accent",
                    nodeType === "quantity"
                      ? "border-primary bg-primary/10"
                      : "border-muted",
                  )}
                >
                  <BarChart3 className="h-8 w-8" />
                  <span className="font-medium">{t("nodes.type.quantity")}</span>
                </Label>
              </div>

              {/* Duration */}
              <div>
                <RadioGroupItem
                  value="duration"
                  id="duration"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="duration"
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer",
                    "transition-all hover:bg-accent",
                    nodeType === "duration"
                      ? "border-primary bg-primary/10"
                      : "border-muted",
                  )}
                >
                  <Timer className="h-8 w-8" />
                  <span className="font-medium">{t("nodes.type.duration")}</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Целевое значение (для Quantity/Duration) */}
          {nodeType !== "binary" && (
            <div className="space-y-2">
              <Label htmlFor="target_value">
                {t("nodes.form.fields.targetValue")} <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="target_value"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="10000"
                  placeholder={
                    nodeType === "duration" 
                      ? t("nodes.form.fields.targetPlaceholder.duration") 
                      : t("nodes.form.fields.targetPlaceholder.quantity")
                  }
                  className={cn(
                    errors.target_value &&
                    "border-destructive focus-visible:ring-destructive",
                  )}
                  value={previewValues.target_value || ""}
                  onChange={(e) =>
                    setValue(
                      "target_value",
                      parseFloat(e.target.value) || undefined,
                    )
                  }
                />
                <span className="flex items-center text-sm text-muted-foreground">
                  {nodeType === "duration" ? t("nodes.form.fields.units.minutes") : t("nodes.form.fields.units.units")}
                </span>
              </div>
              {errors.target_value && (
                <p className="text-sm text-destructive">
                  {errors.target_value.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {t("nodes.form.fields.targetHint")}
              </p>
            </div>
          )}

          {/* Масса (сложность) */}
          <div className="space-y-2">
            <Label htmlFor="mass">
              {t("nodes.form.fields.mass", { value: previewValues.mass?.toFixed(1) || "1.0" })}
            </Label>
            <Input
              id="mass"
              type="range"
              min="0.5"
              max="10"
              step="0.5"
              className="py-2"
              value={previewValues.mass || 1.0}
              onChange={(e) => setValue("mass", parseFloat(e.target.value))}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t("nodes.form.fields.massLevels.easy")} (0.5)</span>
              <span>{t("nodes.form.fields.massLevels.medium")} (5.0)</span>
              <span>{t("nodes.form.fields.massLevels.hard")} (10.0)</span>
            </div>
          </div>

          {/* Коннектор */}
          <div className="space-y-2">
            <Label>
              {t("nodes.form.fields.connectors")} <span className="text-destructive">*</span>
            </Label>
            <ConnectorSelector
              value={previewValues.connector_ids || []}
              onChange={(connectorIds) =>
                setValue("connector_ids", connectorIds)
              }
            />
            {errors.connector_ids && (
              <p className="text-sm text-destructive">
                {errors.connector_ids.message}
              </p>
            )}
          </div>

          {/* Цвет */}
          <div className="space-y-2">
            <Label>{t("nodes.form.fields.color")}</Label>
            <ColorPicker
              value={previewValues.color || "#8b5cf6"}
              onChange={(color) => setValue("color", color)}
            />
          </div>

          {/* Иконка */}
          <div className="space-y-2">
            <Label>{t("nodes.form.fields.icon")}</Label>
            <IconPicker
              value={previewValues.icon || "Circle"}
              onChange={(icon) => setValue("icon", icon)}
            />
            {errors.icon && (
              <p className="text-sm text-destructive">{errors.icon.message}</p>
            )}
          </div>

          {/* Описание */}
          <div className="space-y-2">
            <Label htmlFor="description">{t("nodes.form.fields.description")}</Label>
            <Input
              id="description"
              placeholder={t("nodes.form.fields.descriptionPlaceholder")}
              className={cn(
                errors.description &&
                "border-destructive focus-visible:ring-destructive",
              )}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Фокус по умолчанию */}
          <div className="flex items-center space-x-2 p-4 rounded-xl border border-white/5 bg-background/50">
            <Checkbox 
              id="is_focus_default" 
              checked={watch("is_focus_default")}
              onCheckedChange={(checked) => setValue("is_focus_default", checked === true)}
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

        {/* Правая колонка - Предпросмотр */}
        <div className="lg:sticky lg:top-6 h-fit space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-medium">{t("nodes.preview.title")}</span>
              </div>

              <NodePreview
                name={previewValues.name || ""}
                icon={previewValues.icon || "Circle"}
                color={previewValues.color || "#8b5cf6"}
                connectorNames={connectorNames}
                nodeType={previewValues.node_type}
                mass={previewValues.mass}
                targetValue={previewValues.target_value}
              />

              <div className="text-xs text-muted-foreground space-y-1">
                <p className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-primary" />
                  {t("nodes.preview.stabilityAuto")}
                </p>
                <p className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-primary" />
                  {t("nodes.preview.connectorsLogic")}
                </p>
                <p className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-primary" />
                  {t("nodes.preview.massLogic")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Кнопки действий */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/")}
              className="flex-1"
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={createMutation.isPending} className="flex-1">
              {createMutation.isPending ? (
                t("nodes.form.create.submitting")
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {t("nodes.form.create.submit")}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
