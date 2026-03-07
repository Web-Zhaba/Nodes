import type { GraphNode } from "../model/types";

/**
 * Утилиты для кастомной отрисовки узлов и подписей на Canvas.
 * Только fontSize делится на globalScale — текст остаётся постоянного размера
 * на экране при любом уровне зума.
 * offset и nodeSize задаются в graph-единицах: они масштабируются вместе с графом
 * (чем больше zoom, тем больше визуальный отступ — как и сам узел).
 */

/** Радиус ядра в graph-единицах */
export const CORE_RADIUS = 18;

/** Рендерим иконки в 4× разрешении → потом масштабируем вниз, sharp на HiDPI */
export const ICON_PIXEL_RATIO = 4;

export type DrawNodeLabelProps = {
  // Узел
  node: GraphNode & { x: number; y: number; pointerArea?: any };
  // Контекст рисования
  ctx: CanvasRenderingContext2D;
  // Глобальный масштаб
  globalScale?: number;
  // Размер шрифта
  fontSize?: number;
  // Отступ от узла
  offset?: number;
  // Узлы в состоянии hover (задел на будущее)
  hoverNodes?: (GraphNode | null)[];
  // Выбранные узлы (задел на будущее)
  clickNodes?: (GraphNode | null)[];
  // Цвет подписи
  labelColor?: string;
  // Режим отладки
  debug?: boolean;
};

// Дефолтные значения (теперь это только fallback)
export const defaultColors = {
  nodeColor: "#8888aa",
  activeNodeColor: "#6c63ff",
  labelColor: "rgba(255, 255, 255, 0.75)", // Fallback для светлой/темной темы
  tooltipColor: "#f7ebeb",
};

/**
 * Простой хелпер для получения значения CSS-переменной.
 * Canvas не умеет работать с var() напрямую, поэтому вычисляем.
 */
export function getCssVar(name: string, fallback: string = "#000000"): string {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  
  // Если это oklch или другие сложные форматы, Canvas может их не понять в старых браузерах,
  // но современные браузеры (Chrome 111+, Safari 16.4+) поддерживают их в fillStyle.
  return value || fallback;
}

export interface DrawNodeCircleProps {
  node: GraphNode & { x: number; y: number };
  ctx: CanvasRenderingContext2D;
  radius: number;
}

/**
 * Рисует круг узла (заливка + граница).
 * Цвет наследуется из node.color.
 */
export function drawNodeCircle({
  node,
  ctx,
  radius,
}: DrawNodeCircleProps): void {
  const { x, y, color, nodeKind } = node;
  const isCore = nodeKind === "core";

  // Заливка (прозрачная, ≈ 13–20%)
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fillStyle = color + (isCore ? "33" : "22");
  ctx.fill();

  // Граница
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = color;
  ctx.lineWidth = isCore ? 2.5 : 1.5;
  ctx.stroke();
}

export const drawNodeLabel = ({
  node,
  ctx,
  globalScale = 1,
  fontSize = 12,
  offset = 4,
  hoverNodes = [],
  clickNodes = [],
  debug = false,
  labelColor: customLabelColor,
}: DrawNodeLabelProps): void => {
  const { activeNodeColor, labelColor: defaultLabelColor } = defaultColors;
  const labelColor = customLabelColor || defaultLabelColor;

  const nodeX = node.x || 0;
  const nodeY = node.y || 0;
  
  // Для Core берем фиксированный размер, для Node - вычисляем
  const isCore = node.nodeKind === "core";
  const nodeSize = isCore ? CORE_RADIUS : Math.max(4, node.val ?? 4);

  // Кастомные размеры для Core vs Node
  const finalFontSize = isCore ? 12 : fontSize;
  const finalOffset = isCore ? 6 : offset;

  // Рисуем текст
  const label = String(node.name) || "";
  
  // ФИКС ОТЗЕРКАЛИВАНИЯ ПРИ ЗУМЕ: 
  // Браузеры багуют, когда размер шрифта (_fontSize) становится меньше 1px.
  // Поэтому мы инвертируем масштаб context'а и рисуем текст в нормальных экранных пикселях.
  ctx.save();
  // 1. Сначала смещаем начало координат в точку, где должен быть текст (в координатах графа)
  ctx.translate(nodeX, nodeY + nodeSize + finalOffset);
  // 2. Затем инвертируем глобальный зум
  ctx.scale(1 / globalScale, 1 / globalScale);

  ctx.font = isCore 
    ? `bold ${finalFontSize}px Inter, system-ui, sans-serif`
    : `${finalFontSize}px Inter, system-ui, sans-serif`;
    
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  
  // Цвет подписи зависит от состояния узла (и типа)
  const _labelColor = isCore ? node.color : labelColor;
  const labelActiveColor = activeNodeColor;
  
  ctx.fillStyle =
    hoverNodes.includes(node) || clickNodes.includes(node)
      ? labelActiveColor
      : _labelColor;
      
  // 3. Отступы уже учтены в translate(), поэтому рисуем строго в (0,0)
  ctx.fillText(label, 0, 0);

  // Вычисляем значения для области выделения/клика
  // measureText теперь возвращает ширину в ЭКРАННЫХ пикселях, нужно перевести обратно в граф
  const screenTextWidth = ctx.measureText(label).width;
  ctx.restore();

  const graphTextWidth = screenTextWidth / globalScale;
  const graphFontSize = finalFontSize / globalScale;

  const pointerArea = {
    x: nodeX - graphTextWidth / 2,
    y: nodeY - nodeSize / 2 - finalOffset / 2,
    width: graphTextWidth,
    // В оригинальной статье была ошибка: смешивали экранный fontSize и графовый offset. Здесь исправлено на graphFontSize.
    height: nodeSize + graphFontSize + finalOffset,
  };

  // Если включен режим отладки
  if (debug) {
    // Рисуем область выделения/клика
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.fillRect(
      pointerArea.x,
      pointerArea.y,
      pointerArea.width,
      pointerArea.height
    );
  }

  // Для повторного использования в `drawNodePointerArea`
  node.pointerArea = pointerArea;
};

export type NodePointerArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DrawNodePointerAreaProps = {
  // Узел
  node: GraphNode & { x: number; y: number; pointerArea?: NodePointerArea };
  // Цвет
  color: string;
  // Контекст рисования
  ctx: CanvasRenderingContext2D;
};

export const drawNodePointerArea = ({
  node,
  color,
  ctx,
}: DrawNodePointerAreaProps): void => {
  ctx.fillStyle = color;
  const pointerArea: NodePointerArea | undefined = node.pointerArea;
  if (pointerArea) {
    ctx.fillRect(
      pointerArea.x,
      pointerArea.y,
      pointerArea.width,
      pointerArea.height
    );
  }
};
