"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Sparkles,
  Zap,
  BarChart3,
  Timer,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import type { NodeType } from "@/types";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import {
  createNodeSchema,
  type CreateNodeFormData,
} from "../lib/createNodeSchema";
import { createNode } from "../nodeService";
import { getUserConnectors } from "@/features/connectors/connectorService";
import { ColorPicker } from "./ColorPicker";
import { IconPicker } from "./IconPicker";
import { ConnectorSelector } from "./ConnectorSelector";
import { NodePreview } from "./NodePreview";

/**
 * Основная форма создания узла
 */
export function CreateNodeForm() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nodeType, setNodeType] = useState<NodeType>("binary");
  const [connectorNames, setConnectorNames] = useState<string[]>([]);
  const [allConnectors, setAllConnectors] = useState<
    Array<{ id: string; name: string; color: string }>
  >([]);

  // Загружаем коннекторы пользователя
  useEffect(() => {
    loadConnectors();
  }, []);

  const loadConnectors = async () => {
    const data = await getUserConnectors();
    setAllConnectors(data);
  };

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
    },
  });

  // Следим за значениями для предпросмотра
  const previewValues = watch();

  // Обновляем названия коннекторов при изменении выбранных ID
  useEffect(() => {
    const selectedNames = allConnectors
      .filter((c) => previewValues.connector_ids?.includes(c.id))
      .map((c) => c.name);
    setConnectorNames(selectedNames);
  }, [previewValues.connector_ids, allConnectors]);

  // Обработка отправки формы
  const onSubmit = async (data: CreateNodeFormData) => {
    setIsSubmitting(true);

    try {
      // Создаём узел с коннекторами
      const newNode = await createNode({
        name: data.name,
        description: data.description,
        node_type: data.node_type,
        mass: data.mass,
        target_value:
          data.node_type !== "binary" ? data.target_value : undefined,
        color: data.color,
        icon: data.icon,
        connector_ids: data.connector_ids,
      });

      if (!newNode) {
        throw new Error("Не удалось создать узел");
      }

      toast.success("Узел создан", {
        description: `"${newNode.name}" добавлен в вашу сеть`,
      });

      // Редирект на главную
      navigate("/");
    } catch (error) {
      console.error("Ошибка создания узла:", error);
      toast.error("Ошибка", {
        description:
          error instanceof Error ? error.message : "Не удалось создать узел",
      });
    } finally {
      setIsSubmitting(false);
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
          <h1 className="text-2xl font-bold">Создание узла</h1>
          <p className="text-sm text-muted-foreground">
            Добавьте новую единицу действия в вашу сеть
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
              Название узла <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Например: Утренняя медитация"
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
              Тип узла <span className="text-destructive">*</span>
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
                  <span className="font-medium">Binary</span>
                  <span className="text-xs text-muted-foreground">Да/Нет</span>
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
                  <span className="font-medium">Quantity</span>
                  <span className="text-xs text-muted-foreground">Сколько</span>
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
                  <span className="font-medium">Duration</span>
                  <span className="text-xs text-muted-foreground">
                    Как долго
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Целевое значение (для Quantity/Duration) */}
          {nodeType !== "binary" && (
            <div className="space-y-2">
              <Label htmlFor="target_value">
                Целевое значение <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="target_value"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="10000"
                  placeholder={
                    nodeType === "duration" ? "30 (мин)" : "10 (ед.)"
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
                  {nodeType === "duration" ? "мин" : "ед."}
                </span>
              </div>
              {errors.target_value && (
                <p className="text-sm text-destructive">
                  {errors.target_value.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Например: 30 минут для медитации или 2 литра для воды
              </p>
            </div>
          )}

          {/* Масса (сложность) */}
          <div className="space-y-2">
            <Label htmlFor="mass">
              Масса (сложность): {previewValues.mass?.toFixed(1) || "1.0"}
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
              <span>Легко (0.5)</span>
              <span>Средне (5.0)</span>
              <span>Сложно (10.0)</span>
            </div>
          </div>

          {/* Коннектор */}
          <div className="space-y-2">
            <Label>
              Коннекторы <span className="text-destructive">*</span>
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
            <Label>Цвет узла</Label>
            <ColorPicker
              value={previewValues.color || "#8b5cf6"}
              onChange={(color) => setValue("color", color)}
            />
          </div>

          {/* Иконка */}
          <div className="space-y-2">
            <Label>Иконка (Lucide)</Label>
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
            <Label htmlFor="description">Описание (опционально)</Label>
            <Input
              id="description"
              placeholder="Краткое описание узла..."
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
        </div>

        {/* Правая колонка - Предпросмотр */}
        <div className="lg:sticky lg:top-6 h-fit space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-medium">Предпросмотр</span>
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
                  Стабильность рассчитывается автоматически
                </p>
                <p className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-primary" />
                  Коннекторы объединяют узлы по смыслу
                </p>
                <p className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-primary" />
                  Масса влияет на скорость накопления стабильности
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
              Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                "Создание..."
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Создать узел
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
