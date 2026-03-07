import type { GraphNode } from "../model/types";

/**
 * Утилиты для кастомной отрисовки узлов и подписей на Canvas.
 * Архитектура соответствует паттерну из статьи (Graph/utils.ts).
 *
 * Ключевая формула масштабирования текста (из статьи):
 *   const _fontSize = fontSize / globalScale
 *
 * Только fontSize делится на globalScale — текст остаётся постоянного размера
 * на экране при любом уровне зума.
 * offset и nodeSize задаются в graph-единицах: они масштабируются вместе с графом
 * (чем больше zoom, тем больше визуальный отступ — как и сам узел).
 */

// ─── Константы ──────────────────────────────────────────────────────────────

/** Радиус ядра в graph-единицах */
export const CORE_RADIUS = 18;

/** Размер шрифта в экранных пикселях (делится на globalScale → постоянный на экране) */
const FONT_SIZE_CORE = 12; // screen px
const FONT_SIZE_NODE = 10; // screen px

/** Отступ от края узла до центра текста — в graph-единицах (масштабируется с зумом) */
const OFFSET_CORE = 6; // graph units
const OFFSET_NODE = 5; // graph units

/** Рендерим иконки в 4× разрешении → потом масштабируем вниз, sharp на HiDPI */
export const ICON_PIXEL_RATIO = 4;

// ─── Типы ───────────────────────────────────────────────────────────────────

export interface DrawNodeLabelProps {
  node: GraphNode & { x: number; y: number };
  ctx: CanvasRenderingContext2D;
  globalScale?: number;
}

export interface DrawNodeCircleProps {
  node: GraphNode & { x: number; y: number };
  ctx: CanvasRenderingContext2D;
  radius: number;
}

// ─── Функции рисования ──────────────────────────────────────────────────────

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

/**
 * Рисует подпись под узлом.
 *
 * Точно следует формуле из статьи:
 *   const _fontSize = fontSize / globalScale     ← только это делится
 *   ctx.fillText(label, nodeX, nodeY + nodeSize + offset)  ← offset в graph-единицах
 *
 * textBaseline = 'middle' → labelY указывает на центр строки.
 * offset (graph units) обеспечивает отступ, который растёт вместе с зумом
 * (аналогично тому, как и сам узел становится больше при приближении).
 */
export function drawNodeLabel({
  node,
  ctx,
  globalScale = 1,
}: DrawNodeLabelProps): void {
  const { x, y, name, color, nodeKind } = node;
  const isCore = nodeKind === "core";
  const radius = isCore ? CORE_RADIUS : Math.max(4, node.val ?? 4);

  const fontSize = isCore ? FONT_SIZE_CORE : FONT_SIZE_NODE;
  const offset = isCore ? OFFSET_CORE : OFFSET_NODE;

  // Формула из статьи: только fontSize делится на globalScale
  const _fontSize = fontSize / globalScale;

  ctx.font = isCore
    ? `bold ${_fontSize}px Inter, system-ui, sans-serif`
    : `${_fontSize}px Inter, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = isCore ? color : "rgba(255,255,255,0.75)";

  // Позиция текста: nodeY + nodeSize + offset — точно как в статье
  ctx.fillText(name, x, y + radius + offset);
}
