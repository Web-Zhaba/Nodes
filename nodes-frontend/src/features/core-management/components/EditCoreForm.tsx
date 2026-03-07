import { useState } from "react";
import { useUpdateCoreMutation, useDeleteCoreMutation } from "../hooks/useCoresQuery";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { IconPicker } from "@/features/nodes/components/IconPicker";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import type { Core } from "@/types";

interface EditCoreFormProps {
  core: Core;
  onSuccess?: () => void;
  onDelete?: () => void;
}

export function EditCoreForm({ core, onSuccess, onDelete }: EditCoreFormProps) {
  const updateMutation = useUpdateCoreMutation();
  const deleteMutation = useDeleteCoreMutation();
  
  const [name, setName] = useState(core.name);
  const [color, setColor] = useState(core.color || "#8b5cf6");
  const [icon, setIcon] = useState(core.icon || "Circle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const updates = { name: name.trim(), color, icon };
      await updateMutation.mutateAsync({ coreId: core.id, updates });
      toast.success("Ядро успешно обновлено!");
      onSuccess?.();
    } catch (error) {
      toast.error("Не удалось обновить ядро");
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Вы действительно хотите удалить ядро "${core.name}"? Это также удалит все связи с узлами.`)) return;
    
    try {
      await deleteMutation.mutateAsync(core.id);
      toast.success("Ядро удалено");
      onDelete?.();
    } catch (error) {
      toast.error("Не удалось удалить ядро");
    }
  };

  return (
    <Card className="w-full border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle>Редактирование Ядра</CardTitle>
        <CardDescription>
          Измените основные свойства центра притяжения
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="editCoreName">Название ядра</Label>
            <Input 
              id="editCoreName" 
              placeholder="Спорт, Здоровье, Карьера..." 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editCoreColor">Фирменный цвет</Label>
              <div className="flex gap-4 items-center">
                <Input 
                  id="editCoreColor" 
                  type="color" 
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Иконка</Label>
              <IconPicker
                value={icon}
                onChange={setIcon}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="destructive" 
            size="icon"
            onClick={handleDelete}
            disabled={updateMutation.isPending || deleteMutation.isPending}
            title="Удалить ядро"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button type="submit" disabled={!name.trim() || updateMutation.isPending || deleteMutation.isPending}>
            {updateMutation.isPending ? "Сохранение..." : "Сохранить изменения"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
