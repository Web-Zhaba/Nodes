import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Plus, X } from "lucide-react";
import type { Connector } from "@/types";
import {
  getUserConnectors,
  createConnector,
} from "@/features/connectors/connectorService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConnectorTag } from "@/components/ui/connector-tag";

interface ConnectorSelectorProps {
  value: string[]; // Массив ID выбранных коннекторов
  onChange: (connectorIds: string[]) => void;
  className?: string;
}

/**
 * Компонент выбора множественных коннекторов (семантических связей)
 * Перенесен в entities для общего использования
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
      onChange(value.filter((id) => id !== connectorId));
    } else {
      onChange([...value, connectorId]);
    }
  };

  // Обработка создания нового коннектора
  const handleCreateConnector = async () => {
    if (!customValue.trim()) return;

    const newConnector = await createConnector(customValue.trim());
    if (newConnector) {
      await loadConnectors();
      onChange([...value, newConnector.id]);
    }

    setCustomValue("");
    setShowCustomInput(false);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Выбранные коннекторы (используем новый UI компонент) */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {connectors
            .filter((c) => value.includes(c.id))
            .map((connector) => (
              <ConnectorTag
                key={connector.id}
                name={connector.name}
                color={connector.color}
                onRemove={() => handleToggleConnector(connector.id)}
                interactive
              />
            ))}
        </div>
      )}

      {/* Существующие коннекторы для выбора */}
      {!isLoading && connectors.length > 0 && connectors.some(c => !value.includes(c.id)) && (
        <div className="flex flex-wrap gap-2">
          {connectors
            .filter((c) => !value.includes(c.id))
            .map((connector) => (
              <ConnectorTag
                key={connector.id}
                name={connector.name}
                color={connector.color}
                active={false}
                onClick={() => handleToggleConnector(connector.id)}
              />
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
          className="h-9 border-dashed text-xs"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Новый коннектор
        </Button>
      ) : (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              #
            </span>
            <Input
              type="text"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value.replace(/^#/, ""))}
              placeholder="название..."
              className="pl-7 h-9 text-sm"
              autoFocus
              onBlur={() => !customValue.trim() && setShowCustomInput(false)}
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
            className="h-9"
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
    </div>
  );
}
