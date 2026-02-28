"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Zap,
  BarChart3,
  Timer,
  Trash2,
  Loader2,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import type { NodeType } from "@/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import {
  createNodeSchema,
  type CreateNodeFormData,
} from "../lib/createNodeSchema";
import { updateNode, deleteNode, getNodeById } from "../nodeService";
import { getUserConnectors } from "@/features/connectors/connectorService";
import { ColorPicker } from "./ColorPicker";
import { IconPicker } from "./IconPicker";
import { NodePreview } from "./NodePreview";
import { ConnectorSelector } from "./ConnectorSelector";

interface EditNodeFormProps {
  nodeId: string;
}

/**
 * Форма редактирования существующего узла
 */
export function EditNodeForm({ nodeId }: EditNodeFormProps) {
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [nodeType, setNodeType] = useState<NodeType>("binary");
  const [connectorNames, setConnectorNames] = useState<string[]>([]);
  const [allConnectors, setAllConnectors] = useState<
    Array<{ id: string; name: string; color: string }>
  >([]);

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
  });

  // Загружаем данные узла и коннекторы
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const [nodeData, connectorsData] = await Promise.all([
          getNodeById(nodeId),
          getUserConnectors(user?.id),
        ]);

        if (!nodeData) {
          toast.error("Узел не найден");
          navigate("/nodes");
          return;
        }

        setAllConnectors(connectorsData);
        setNodeType(nodeData.node_type);

        // Инициализируем форму
        reset({
          name: nodeData.name,
          description: nodeData.description || "",
          node_type: nodeData.node_type,
          mass: nodeData.mass,
          target_value: nodeData.target_value,
          color: nodeData.color || "#8b5cf6",
          icon: nodeData.icon || "Circle",
          connector_ids: nodeData.connector_ids || [],
        });
      } catch (error) {
        console.error("Ошибка инициализации:", error);
        toast.error("Ошибка загрузки данных");
      } finally {
        setIsLoading(false);
      }
    };

    if (user && !isAuthLoading) {
      init();
    }
  }, [nodeId, reset, navigate, user, isAuthLoading]);

  // Следим за значениями для предпросмотра
  const previewValues = watch();

  // Обновляем названия коннекторов
  useEffect(() => {
    const selectedNames = allConnectors
      .filter((c) => previewValues.connector_ids?.includes(c.id))
      .map((c) => c.name);
    setConnectorNames(selectedNames);
  }, [previewValues.connector_ids, allConnectors]);

  // Удаление узла
  const handleDelete = async () => {
    if (!window.confirm("Вы уверены, что хотите удалить этот узел? Все данные будут потеряны.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const success = await deleteNode(nodeId);
      if (success) {
        toast.success("Узел удален");
        navigate("/nodes");
      } else {
        throw new Error("Не удалось удалить узел");
      }
    } catch (error) {
      toast.error("Ошибка удаления");
      setIsDeleting(false);
    }
  };

  // Сохранение изменений
  const onSubmit = async (data: CreateNodeFormData) => {
    console.log("Submitting data:", data); // Для отладки
    setIsSubmitting(true);
    try {
      const success = await updateNode(nodeId, {
        name: data.name,
        description: data.description,
        node_type: data.node_type,
        mass: data.mass,
        target_value: data.node_type !== "binary" ? data.target_value : undefined,
        color: data.color,
        icon: data.icon,
        connector_ids: data.connector_ids, // ВАЖНО: добавил отправку коннекторов
      }, user?.id);

      if (success) {
        toast.success("Изменения сохранены");
        navigate("/nodes");
      } else {
        throw new Error("Не удалось обновить узел");
      }
    } catch (error) {
      console.error("Ошибка обновления:", error);
      toast.error("Ошибка при сохранении");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Загрузка данных узла...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full">
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
            <h1 className="text-3xl font-bold tracking-tight">Настройки узла</h1>
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
          disabled={isDeleting}
          className="text-destructive hover:bg-destructive/10 border-destructive/20 gap-2 w-fit"
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          Удалить узел
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-8">
          {/* Название */}
          <div className="space-y-3">
            <Label htmlFor="name" className="text-base">Название узла</Label>
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
            <Label className="text-base">Тип нейронной связи</Label>
            <RadioGroup
              value={nodeType}
              onValueChange={(v) => {
                const type = v as NodeType;
                setNodeType(type);
                setValue("node_type", type);
                if (type === "binary") setValue("target_value", undefined);
              }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              {[
                { id: "binary", label: "Binary", icon: Zap, desc: "Да/Нет" },
                { id: "quantity", label: "Quantity", icon: BarChart3, desc: "Число" },
                { id: "duration", label: "Duration", icon: Timer, desc: "Время" },
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
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{t.desc}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Целевое значение */}
          {nodeType !== "binary" && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <Label htmlFor="target_value" className="text-base">Цель за день</Label>
              <div className="flex gap-3">
                <Input
                  id="target_value"
                  type="number"
                  step="0.1"
                  className="h-11"
                  {...register("target_value", { valueAsNumber: true })}
                />
                <div className="flex items-center px-4 rounded-lg bg-muted text-sm font-medium">
                  {nodeType === "duration" ? "мин" : "ед."}
                </div>
              </div>
              {errors.target_value && (
                <p className="text-sm text-destructive">{errors.target_value.message}</p>
              )}
            </div>
          )}

          {/* Масса */}
          <div className="space-y-3">
            <Label htmlFor="mass" className="text-base">Масса (сложность): {previewValues.mass?.toFixed(1) || "1.0"}</Label>
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
          </div>

          {/* Коннекторы */}
          <div className="space-y-3">
            <Label className="text-base">Коннекторы</Label>
            <ConnectorSelector
              value={previewValues.connector_ids || []}
              onChange={(ids) => setValue("connector_ids", ids)}
            />
            {errors.connector_ids && (
              <p className="text-sm text-destructive">{errors.connector_ids.message}</p>
            )}
          </div>

          {/* Визуал */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-base">Цвет</Label>
              <ColorPicker
                value={previewValues.color || "#8b5cf6"}
                onChange={(color) => setValue("color", color)}
              />
            </div>
            <div className="space-y-3">
              <Label className="text-base">Иконка</Label>
              <IconPicker
                value={previewValues.icon || "Circle"}
                onChange={(icon) => setValue("icon", icon)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="description" className="text-base">Описание</Label>
            <Input
              id="description"
              placeholder="Коротко о сути задачи..."
              {...register("description")}
            />
          </div>
        </div>

        {/* Предпросмотр и действия */}
        <div className="lg:sticky lg:top-8 h-fit space-y-8">
          <Card className="overflow-hidden border-2 border-primary/10 shadow-xl shadow-primary/5">
            <CardContent className="p-8">
              <div className="text-sm font-bold uppercase tracking-widest text-primary/60 mb-6">Предпросмотр</div>
              <NodePreview
                name={previewValues.name || "Название узла"}
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
              Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting} size="lg" className="flex-1 h-12 gap-2 shadow-lg shadow-primary/20">
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
              {isSubmitting ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
