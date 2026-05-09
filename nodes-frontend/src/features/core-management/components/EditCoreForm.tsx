import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
      toast.success(t("graph.cores.edit.success"));
      onSuccess?.();
    } catch {
      toast.error(t("graph.cores.edit.error"));
    }
  };

  const handleDelete = async () => {
    if (!confirm(t("graph.cores.delete.confirm", { name: core.name }))) return;
    
    try {
      await deleteMutation.mutateAsync(core.id);
      toast.success(t("graph.cores.delete.success"));
      onDelete?.();
    } catch {
      toast.error(t("graph.cores.delete.error"));
    }
  };

  return (
    <Card className="w-full border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle>{t("graph.cores.edit.title")}</CardTitle>
        <CardDescription>
          {t("graph.cores.edit.description")}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="editCoreName">{t("graph.cores.fields.name")}</Label>
            <Input 
              id="editCoreName" 
              placeholder={t("graph.cores.fields.namePlaceholder")} 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editCoreColor">{t("graph.cores.fields.color")}</Label>
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
              <Label>{t("graph.cores.fields.icon")}</Label>
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
            title={t("graph.cores.delete.button")}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button type="submit" disabled={!name.trim() || updateMutation.isPending || deleteMutation.isPending}>
            {updateMutation.isPending ? t("graph.cores.edit.submitting") : t("graph.cores.edit.submit")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
