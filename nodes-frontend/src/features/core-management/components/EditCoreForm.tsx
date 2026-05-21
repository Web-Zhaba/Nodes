import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useUpdateCoreMutation, useDeleteCoreMutation } from "../hooks/useCoresQuery";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { IconPicker } from "@/features/nodes/components/IconPicker";
import { toast } from "sonner";
import { Trash2, Globe, Lock, Loader2 } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import type { Core } from "@/types";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [isPublic, setIsPublic] = useState(core.is_public ?? false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const updates = { name: name.trim(), color, icon, is_public: isPublic };
      await updateMutation.mutateAsync({ coreId: core.id, updates });
      toast.success(t("graph.cores.edit.success"));
      onSuccess?.();
    } catch {
      toast.error(t("graph.cores.edit.error"));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(core.id);
      toast.success(t("graph.cores.delete.success"));
      onDelete?.();
    } catch {
      toast.error(t("graph.cores.delete.error"));
    }
  };

  return (
    <>
      <Card className="w-full border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle>{t("graph.cores.edit.title")}</CardTitle>
          <CardDescription>
            {t("graph.cores.edit.description")}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
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

            {/* Privacy Toggle */}
            <div className="flex items-center justify-between p-4 bg-background/50 rounded-2xl border border-border/40 transition-all hover:border-primary/20">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                  isPublic ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  {isPublic ? <Globe className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </div>
                <div>
                  <Label htmlFor="core-privacy" className="font-bold cursor-pointer">{t("settings.privacy.nodes")}</Label>
                  <p className="text-[10px] text-muted-foreground">
                    {isPublic ? "Ядро видно всем в публичном графе" : "Ядро скрыто от посторонних"}
                  </p>
                </div>
              </div>
              <Switch
                id="core-privacy"
                checked={isPublic}
                onCheckedChange={setIsPublic}
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
          <CardFooter className="flex justify-between pt-2">
            <Button 
              type="button" 
              variant="destructive" 
              size="icon"
              onClick={() => setShowDeleteDialog(true)}
              disabled={updateMutation.isPending || deleteMutation.isPending}
              title={t("graph.cores.delete.button")}
              className="rounded-xl h-10 w-10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button 
              type="submit" 
              disabled={!name.trim() || updateMutation.isPending || deleteMutation.isPending}
              className="rounded-xl px-6"
            >
              {updateMutation.isPending ? t("graph.cores.edit.submitting") : t("graph.cores.edit.submit")}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-3xl border-border/40 bg-background/80 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">
              {t("graph.cores.delete.confirmTitle", "Удаление ядра")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
              {t("graph.cores.delete.confirm", { name: core.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3">
            <AlertDialogCancel 
              className="rounded-2xl border-border/40 hover:bg-muted/50 transition-all"
              disabled={deleteMutation.isPending}
            >
              {t("common.cancel", "Отмена")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="rounded-2xl bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/20 transition-all gap-2"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {t("common.delete", "Удалить")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
