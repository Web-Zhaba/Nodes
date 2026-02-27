import { useState } from "react";
import { cn } from "@/lib/utils";
import { Icons } from "@/lib/icons";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  className?: string;
}

/**
 * Иконки сгруппированные по категориям
 */
const ICON_CATEGORIES = [
  {
    category: "Активность и спорт",
    icons: ["Activity", "Dumbbell", "Footprints", "Heart", "Zap", "Flame"],
  },
  {
    category: "Ментальное",
    icons: ["Brain", "Sparkles", "Lightbulb", "Eye", "Smile"],
  },
  {
    category: "Время и тайминг",
    icons: ["Timer", "Clock", "Calendar", "Sun", "Moon", "Sunrise", "Sunset"],
  },
  {
    category: "Еда и вода",
    icons: ["Droplet", "Coffee", "Utensils", "Apple", "CupSoda"],
  },
  {
    category: "Обучение и работа",
    icons: ["Book", "BookOpen", "PenTool", "Target", "Briefcase"],
  },
  {
    category: "Дом и быт",
    icons: ["Home", "Bed", "Bath", "Brush", "Key"],
  },
  {
    category: "Музыка и творчество",
    icons: ["Music", "Palette", "Camera", "Headphones", "Mic"],
  },
  {
    category: "Природа",
    icons: ["TreePine", "Flower", "Cloud", "Wind", "Mountain"],
  },
  {
    category: "Разное",
    icons: ["Circle", "Star", "Trophy", "Award", "Gem", "Anchor", "Compass"],
  },
];

/**
 * Компонент выбора иконки через выпадающий список (Popover)
 */
export function IconPicker({ value, onChange, className }: IconPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);

  // Получаем выбранную иконку
  const SelectedIcon = Icons[value] || Icons.Circle;

  // Фильтруем категории по поиску
  const filteredCategories = searchQuery.trim()
    ? ICON_CATEGORIES.map((cat) => ({
      category: cat.category,
      icons: cat.icons.filter((icon) =>
        icon.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    })).filter((cat) => cat.icons.length > 0)
    : ICON_CATEGORIES;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-full justify-between font-normal", className)}
        >
          <div className="flex items-center gap-2">
            <SelectedIcon className="h-4 w-4" />
            <span>{value}</span>
          </div>
          <Icons.ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <div className="space-y-3 p-3">
          {/* Поле поиска */}
          <div className="relative">
            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Поиск иконки..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          {/* Сетка иконок */}
          {filteredCategories.length > 0 ? (
            <ScrollArea className="h-[280px]">
              <div className="space-y-4">
                {filteredCategories.map(({ category, icons }) => (
                  <div key={category}>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2 px-1">
                      {category}
                    </h4>
                    <div className="grid grid-cols-6 gap-1.5">
                      {icons.map((iconName) => {
                        const IconComponent = Icons[iconName] || Icons.Circle;
                        const isSelected = value === iconName;

                        return (
                          <Button
                            key={iconName}
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              onChange(iconName);
                              setOpen(false);
                            }}
                            className={cn(
                              "h-9 w-9",
                              isSelected &&
                              "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                            )}
                            title={iconName}
                          >
                            <IconComponent className="h-4 w-4" />
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center text-sm text-muted-foreground py-8">
              <Icons.Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Иконки не найдены</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
