import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ru, enUS } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { cn } from "@/lib/utils";
import type { Node } from "@/types";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

interface DailyFocusSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  allNodes: Node[];
  currentFocusIds: string[];
  onSave: (selectedIds: string[]) => Promise<void>;
}

// Вспомогательная функция для рендера иконки по имени
const renderIcon = (iconName: string, className?: string) => {
  return <DynamicIcon name={iconName || "circle"} className={className} />;
};

export function DailyFocusSelector({ isOpen, onClose, date, allNodes, currentFocusIds, onSave }: DailyFocusSelectorProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { t, i18n } = useTranslation();

  // Синхронизируем локальный стейт при открытии
  useEffect(() => {
    if (isOpen) {
      setSelectedIds([...currentFocusIds]);
    }
  }, [isOpen, currentFocusIds]);

  const toggleNode = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const loadDefaults = () => {
    const defaultIds = allNodes
      .filter(n => n.is_focus_default)
      .map(n => n.id);
    setSelectedIds(defaultIds);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(selectedIds);
    setIsSaving(false);
    onClose();
  };

  const dateLocale = i18n.language === 'en' ? enUS : ru;
  const formattedDate = format(date, "d MMMM", { locale: dateLocale });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] sm:max-w-md bg-background border-white/10 rounded-2xl overflow-hidden p-6 gap-0 shadow-2xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-bold tracking-tight">
            {t("dashboard.selector.title", { date: formattedDate })}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {t("dashboard.selector.description", "Выберите узлы для фокуса на выбранный день.")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadDefaults}
            className="text-[10px] uppercase font-bold tracking-widest border-white/5 bg-background/50 h-8 rounded-lg"
          >
            <DynamicIcon name="zap" className="w-3 h-3 mr-1.5 text-primary" />
            {t("dashboard.selector.loadDefaults", "Загрузить по умолчанию")}
          </Button>
          <div className="text-[10px] uppercase font-bold tracking-widest opacity-40">
            {t("dashboard.selector.selectedCount", { count: selectedIds.length })}
          </div>
        </div>

        <div className="mb-2 pr-4 -mr-2">
          {/* CapacityBar удален по просьбе пользователя */}
        </div>

        <ScrollArea className="h-[45vh] pr-4 -mr-2">
          <div className="space-y-3">
            {allNodes.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">
                {t("dashboard.selector.noNodes", "Нет доступных узлов. Создайте их сначала.")}
              </p>
            ) : (
              allNodes.map(node => {
                const isSelected = selectedIds.includes(node.id);
                return (
                  <div
                    key={node.id}
                    onClick={() => toggleNode(node.id)}
                    className={cn(
                      "group flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer active:scale-[0.98]",
                      isSelected
                        ? "border-primary/40 bg-primary/10 shadow-[0_0_15px_rgba(var(--primary),0.1)]"
                        : "border-white/5 bg-background/50 hover:bg-muted/30 text-muted-foreground"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110")}
                        style={{ backgroundColor: isSelected ? `${node.color}20` : "transparent", color: node.color }}
                      >
                        {renderIcon(node.icon || "Circle", "w-5 h-5")}
                      </div>
                      <div className="flex flex-col">
                        <span className={cn("font-bold text-sm tracking-tight", isSelected ? "text-foreground" : "")}>{node.name}</span>
                        <span className="text-[10px] uppercase opacity-40 font-bold tracking-widest">
                          {t(`nodes.type.${node.node_type}`, node.node_type)}
                        </span>
                        {node.is_focus_default && (
                          <Badge variant="outline" className="w-fit h-4 text-[8px] uppercase font-bold tracking-tighter border-primary/20 text-primary px-1 mt-0.5">
                            {t("common.default", "Default")}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-bold opacity-50 bg-muted px-1.5 py-0.5 rounded uppercase">M:{node.mass || 1}</span>
                      <div className={cn(
                        "w-6 h-6 rounded-lg flex items-center justify-center transition-all shadow-sm",
                        isSelected ? "bg-primary text-primary-foreground scale-110" : "bg-muted text-transparent"
                      )}>
                        <DynamicIcon name="check" className="w-4 h-4 font-bold" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between items-stretch sm:items-center">
          <div className="text-xs text-muted-foreground font-bold uppercase tracking-widest text-center sm:text-left">
            {t("dashboard.selector.selectedCount", { count: selectedIds.length })}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row items-stretch">
            <Button variant="ghost" onClick={onClose} disabled={isSaving} className="border border-white/5 rounded-xl">
              {t("common.cancel", "Отмена")}
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="rounded-xl shadow-lg shadow-primary/20">
              {isSaving 
                ? t("dashboard.selector.syncing", "Синхронизация...") 
                : t("dashboard.selector.saveFocus", "Сохранить фокус")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
