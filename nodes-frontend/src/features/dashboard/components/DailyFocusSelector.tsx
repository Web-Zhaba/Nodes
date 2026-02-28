import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { Node } from "@/types";
import { CapacityBar } from "./CapacityBar";

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
  const IconComponent = Icons[iconName || "Circle"] || Icons.Circle;
  return <IconComponent className={className} />;
};

export function DailyFocusSelector({ isOpen, onClose, date, allNodes, currentFocusIds, onSave }: DailyFocusSelectorProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(selectedIds);
    setIsSaving(false);
    onClose();
  };

  const formattedDate = format(date, "d MMMM", { locale: ru });
  const totalMass = allNodes.filter(n => selectedIds.includes(n.id)).reduce((sum, n) => sum + (n.mass || 1), 0);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] sm:max-w-md bg-background border-white/10 rounded-2xl overflow-hidden p-6 gap-0 shadow-2xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-bold tracking-tight">Задачи на {formattedDate}</DialogTitle>
          <DialogDescription className="text-sm">
            Выберите узлы для фокуса на выбранный день.
          </DialogDescription>
        </DialogHeader>

        <div className="mb-2 pr-4 -mr-2">
          <CapacityBar currentMass={totalMass} maxCapacity={10} className="shadow-none border-white/5 bg-background/50" />
        </div>

        <ScrollArea className="h-[45vh] pr-4 -mr-2">
          <div className="space-y-3">
            {allNodes.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">Нет доступных узлов. Создайте их сначала.</p>
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
                        <span className="text-[10px] uppercase opacity-40 font-bold tracking-widest">{node.node_type}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-bold opacity-50 bg-muted px-1.5 py-0.5 rounded uppercase">M:{node.mass || 1}</span>
                      <div className={cn(
                        "w-6 h-6 rounded-lg flex items-center justify-center transition-all shadow-sm",
                        isSelected ? "bg-primary text-primary-foreground scale-110" : "bg-muted text-transparent"
                      )}>
                        <Icons.Check className="w-4 h-4 font-bold" />
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
            {selectedIds.length} выбрано
          </div>
          <div className="flex flex-col gap-3 sm:flex-row items-stretch">
            <Button variant="ghost" onClick={onClose} disabled={isSaving} className="border border-white/5 rounded-xl">
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="rounded-xl shadow-lg shadow-primary/20">
              {isSaving ? "Синхронизация..." : "Сохранить фокус"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
