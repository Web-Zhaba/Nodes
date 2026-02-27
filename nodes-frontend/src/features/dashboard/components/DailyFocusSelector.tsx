import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { Node } from "@/types";

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
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-white/10">
        <DialogHeader>
          <DialogTitle>Задачи на {formattedDate}</DialogTitle>
          <DialogDescription>
            Выберите узлы для фокуса на выбранный день. Текущая емкость: {totalMass}.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[40vh] mt-4 pr-4">
          <div className="space-y-2">
            {allNodes.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Нет доступных узлов. Создайте их сначала.</p>
            ) : (
              allNodes.map(node => {
                const isSelected = selectedIds.includes(node.id);
                return (
                  <div
                    key={node.id}
                    onClick={() => toggleNode(node.id)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer",
                      isSelected
                        ? "border-primary/50 bg-primary/10"
                        : "border-white/5 bg-background/50 hover:bg-muted/50 text-muted-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0")}
                        style={{ backgroundColor: isSelected ? `${node.color}20` : "transparent", color: node.color }}
                      >
                        {renderIcon(node.icon || "Circle", "w-4 h-4")}
                      </div>
                      <span className={cn("font-medium", isSelected ? "text-foreground" : "")}>{node.name}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs opacity-50">Вес: {node.mass || 1}</span>
                      <div className={cn(
                        "w-5 h-5 rounded flex items-center justify-center transition-all",
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-transparent"
                      )}>
                        <Icons.Check className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="mt-6 flex gap-2 sm:justify-between">
          <div className="text-sm text-muted-foreground flex items-center">
            {selectedIds.length} выбрано
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} disabled={isSaving}>
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Сохранение..." : "Сохранить фокус"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
