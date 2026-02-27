import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Plus, Tag, X } from "lucide-react";
import type { Connector } from "@/types";
import {
  getUserConnectors,
  createConnector,
} from "@/features/connectors/connectorService";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ConnectorSelectorProps {
  value: string[]; // Массив ID выбранных коннекторов
  onChange: (connectorIds: string[]) => void;
  className?: string;
}

/**
 * Компонент выбора множественных коннекторов (семантических связей)
 */
export function ConnectorSelector({
  value,
  onChange,
  className,
}: ConnectorSelectorProps) {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [customValue, setCustomValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Загружаем коннекторы пользователя
  useEffect(() => {
    loadConnectors();
  }, []);

  const loadConnectors = async () => {
    setIsLoading(true);
    const data = await getUserConnectors();
    setConnectors(data);
    setIsLoading(false);
  };

  // Обработка выбора/снятия коннектора
  const handleToggleConnector = (connectorId: string) => {
    if (value.includes(connectorId)) {
      // Удалить из выбранных
      onChange(value.filter((id) => id !== connectorId));
    } else {
      // Добавить к выбранным
      onChange([...value, connectorId]);
    }
  };

  // Обработка создания нового коннектора
  const handleCreateConnector = async () => {
    if (!customValue.trim()) return;

    // Создаём коннектор
    const newConnector = await createConnector(customValue.trim());

    if (newConnector) {
      // Обновляем список
      await loadConnectors();
      // Добавляем к выбранным
      onChange([...value, newConnector.id]);
    }

    setCustomValue("");
    setShowCustomInput(false);
  };

  // Обработка ввода в кастомное поле
  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/^#/, ""); // Удаляем # если есть
    setCustomValue(val);
  };

  // Удаление выбранного коннектора
  const handleRemoveConnector = (e: React.MouseEvent, connectorId: string) => {
    e.stopPropagation();
    onChange(value.filter((id) => id !== connectorId));
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Выбранные коннекторы */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {connectors
            .filter((c) => value.includes(c.id))
            .map((connector) => (
              <Badge
                key={connector.id}
                variant="secondary"
                className="flex items-center gap-1.5 px-3 py-1.5 h-auto font-medium cursor-pointer transition-all"
                style={{
                  backgroundColor: `${connector.color}20`,
                  border: `2px solid ${connector.color}`,
                  color: connector.color,
                }}
                onClick={() => handleToggleConnector(connector.id)}
              >
                <Tag className="h-3.5 w-3.5" />#{connector.name}
                <button
                  type="button"
                  onClick={(e) => handleRemoveConnector(e, connector.id)}
                  className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
        </div>
      )}

      {/* Существующие коннекторы для выбора */}
      {!isLoading && connectors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {connectors
            .filter((c) => !value.includes(c.id))
            .map((connector) => (
              <button
                key={connector.id}
                type="button"
                onClick={() => handleToggleConnector(connector.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
                  "transition-all border-2 hover:scale-105",
                  "bg-muted text-muted-foreground border-transparent hover:border-muted-foreground/30",
                )}
              >
                <Tag className="h-3.5 w-3.5" />#{connector.name}
              </button>
            ))}
        </div>
      )}

      {/* Кнопка создания нового */}
      {!showCustomInput ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowCustomInput(true)}
          className="h-9 border-dashed"
        >
          <Plus className="h-4 w-4 mr-1" />
          Новый коннектор
        </Button>
      ) : (
        /* Форма создания нового коннектора */
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              #
            </span>
            <Input
              type="text"
              value={customValue}
              onChange={handleCustomInputChange}
              placeholder="введите название..."
              className="pl-7"
              autoFocus
              onBlur={() => {
                if (!customValue.trim()) {
                  setShowCustomInput(false);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreateConnector();
                }
                if (e.key === "Escape") {
                  setShowCustomInput(false);
                  setCustomValue("");
                }
              }}
            />
          </div>
          <Button
            type="button"
            onClick={handleCreateConnector}
            disabled={!customValue.trim()}
            size="sm"
          >
            Создать
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              setShowCustomInput(false);
              setCustomValue("");
            }}
            className="h-9 w-9"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Подсказка */}
      <p className="text-xs text-muted-foreground">
        Коннекторы объединяют узлы по смыслу (например: #здоровье, #утро,
        #спорт). Можно выбрать несколько.
      </p>
    </div>
  );
}
