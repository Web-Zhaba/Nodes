import { cn } from "@/lib/utils";
import { Icons } from "@/lib/icons";
import type { NodeType } from "@/types";

interface NodePreviewProps {
  name: string;
  icon: string;
  color: string;
  connectorNames?: string[]; // Массив названий коннекторов для предпросмотра
  nodeType?: NodeType;
  mass?: number | string;
  targetValue?: number | string;
  className?: string;
}

/**
 * Компонент предпросмотра узла (карточка в реальном времени)
 */
export function NodePreview({
  name,
  icon,
  color,
  connectorNames,
  nodeType = "binary",
  mass = 1.0,
  targetValue,
  className,
}: NodePreviewProps) {
  // Получаем иконку из Lucide
  const IconComponent = Icons[icon] || Icons.Circle;

  // Рассчитываем процент стабильности (для примера 60%)
  const stabilityPercent = 60;

  // Преобразуем mass к числу (может прийти как строка из формы)
  const massNum = typeof mass === "string" ? parseFloat(mass) || 1.0 : mass;

  // Отображение типа узла
  const typeLabels: Record<NodeType, string> = {
    binary: "Да/Нет",
    quantity: "Количество",
    duration: "Время",
  };

  return (
    <div
      className={cn(
        "w-full max-w-sm rounded-xl border-2 p-4 transition-all",
        "bg-card hover:shadow-lg",
        className,
      )}
      style={{ borderColor: color + "40" }} // 40 = ~25% opacity
    >
      {/* Заголовок */}
      <div className="flex items-start gap-3 mb-3">
        {/* Иконка */}
        <div
          className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: color + "20" }}
        >
          <IconComponent className="w-6 h-6" style={{ color }} />
        </div>

        {/* Информация */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg truncate">
            {name || "Название узла"}
          </h3>

          {/* Коннекторы */}
          {connectorNames && connectorNames.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {connectorNames.slice(0, 3).map((connName, idx) => (
                <span
                  key={idx}
                  className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded"
                >
                  #{connName}
                </span>
              ))}
              {connectorNames.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{connectorNames.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Тип узла */}
          <p className="text-xs text-muted-foreground mt-1">
            {typeLabels[nodeType]}
          </p>
        </div>
      </div>

      {/* Параметры */}
      <div className="space-y-2 mb-3">
        {/* Масса */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Масса:</span>
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(massNum / 10) * 100}%`,
                backgroundColor: color,
              }}
            />
          </div>
          <span className="font-medium">{massNum.toFixed(1)}</span>
        </div>

        {/* Целевое значение */}
        {nodeType !== "binary" && targetValue && (
          <div className="text-xs text-muted-foreground">
            Цель:{" "}
            <span className="font-medium text-foreground">{targetValue}</span>
            {nodeType === "duration" && " мин"}
          </div>
        )}
      </div>

      {/* Стабильность (превью) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Стабильность</span>
          <span className="font-medium">{stabilityPercent}/100</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${stabilityPercent}%`,
              backgroundColor: color,
            }}
          />
        </div>
      </div>

      {/* Тип узла (иконка) */}
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        {nodeType === "binary" && (
          <>
            <Icons.Zap className="h-3 w-3" />
            <span>Binary</span>
          </>
        )}
        {nodeType === "quantity" && (
          <>
            <Icons.BarChart3 className="h-3 w-3" />
            <span>Quantity</span>
          </>
        )}
        {nodeType === "duration" && (
          <>
            <Icons.Timer className="h-3 w-3" />
            <span>Duration</span>
          </>
        )}
      </div>
    </div>
  );
}
