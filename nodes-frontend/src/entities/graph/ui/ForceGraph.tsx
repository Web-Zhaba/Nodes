import { useRef, useState, useEffect, useCallback } from "react";
import ForceGraph2D from "react-force-graph-2d";
import type { ForceGraphMethods, NodeObject } from "react-force-graph-2d";
import { getIconCanvas, clearIconCache } from "@/features/graph-visualization/lib/iconCache";
import type { GraphData, GraphNode, GraphLink } from "../model/types";
import {
  CORE_RADIUS,
  ICON_PIXEL_RATIO,
  drawNodeCircle,
  drawNodeLabel,
  getCssVar,
} from "../lib/graphUtils";

interface ForceGraphProps {
  graphData: GraphData;
  backgroundColor?: string;
  onNodeClick?: (nodeId: string, kind: "node" | "core") => void;
}

export function ForceGraph({ 
  graphData, 
  backgroundColor = "transparent",
  onNodeClick
}: ForceGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<ForceGraphMethods | undefined>(undefined);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // ── Measure container and react to resize ───────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: Math.floor(entry.contentRect.width),
          height: Math.floor(entry.contentRect.height),
        });
      }
    });

    observer.observe(el);
    setDimensions({ width: Math.floor(el.clientWidth), height: Math.floor(el.clientHeight) });
    return () => observer.disconnect();
  }, []);

  // ── Zoom to fit after data loads ─────────────────────────────────────────
  useEffect(() => {
    if (graphData.nodes.length === 0) return;
    const timer = setTimeout(() => graphRef.current?.zoomToFit(500, 80), 400);
    return () => clearTimeout(timer);
  }, [graphData]);

  // ── Configure D3 forces ──────────────────────────────────────────────────
  useEffect(() => {
    const g = graphRef.current;
    if (!g) return;
    g.d3Force("charge")?.strength?.(-60);
    g.d3Force("link")?.distance?.(50);
  });

  // ── Theme-aware colors ──────────────────────────────────────────────────
  const [colors, setColors] = useState({
    label: "rgba(255, 255, 255, 0.75)",
    muted: "rgba(255, 255, 255, 0.5)",
  });

  const updateColors = useCallback(() => {
    // Используем CSS переменные из index.css (переводятся в oklch или hsl)
    const label = getCssVar("--foreground", "rgba(255, 255, 255, 0.8)");
    const muted = getCssVar("--muted-foreground", "rgba(255, 255, 255, 0.5)");
    setColors({ label, muted });
  }, []);

  useEffect(() => {
    updateColors();
    // Следим за изменением класса .dark на html
    const observer = new MutationObserver(updateColors);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    
    return () => {
      observer.disconnect();
      clearIconCache(); // Возвращаем очистку кэша
    };
  }, [updateColors]);

  // ── Custom node painter ──────────────────────────────────────────────────
  // Вызывает утилиты из graphUtils.ts — по образу статьи (Graph/utils.ts)
  const paintNode = useCallback(
    (rawNode: NodeObject, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const node = rawNode as GraphNode & { x: number; y: number };
      if (!node.x || !node.y) return;

      const isCore = node.nodeKind === "core";
      const radius = isCore ? CORE_RADIUS : Math.max(4, node.val ?? 4);
      const iconSize = isCore ? 14 : 10;

      // 1. Круг (заливка + граница)
      drawNodeCircle({ node, ctx, radius });

      // 2. Иконка (OffscreenCanvas из iconCache)
      const iconCanvas = getIconCanvas(node.icon, node.color, iconSize * ICON_PIXEL_RATIO);
      if (iconCanvas) {
        const half = iconSize / 2;
        ctx.drawImage(iconCanvas, node.x - half, node.y - half, iconSize, iconSize);
      }

      // 3. Подпись (логика в graphUtils.drawNodeLabel)
      // Передаем вычисленный цвет из CSS переменных
      drawNodeLabel({ 
        node, 
        ctx, 
        globalScale,
        labelColor: isCore ? node.color : colors.label // Ядра всегда своего цвета, узлы — цвета текста
      });
    },
    [colors]
  );

  // ── Link accessors ───────────────────────────────────────────────────────
  const getLinkColor = useCallback((link: object) => (link as GraphLink).color, []);
  const getLinkWidth = useCallback(
    (link: object) => ((link as GraphLink).kind === "node-core" ? 1.2 : 0.8),
    []
  );

  // ── Node pointer area ────────────────────────────────────────────────────
  const paintNodePointerArea = useCallback(
    (rawNode: NodeObject, color: string, ctx: CanvasRenderingContext2D) => {
      const node = rawNode as GraphNode & { x: number; y: number };
      if (!node.x || !node.y) return;
      const radius = node.nodeKind === "core" ? CORE_RADIUS : Math.max(4, node.val ?? 4);
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
    },
    []
  );

  return (
    <div ref={containerRef} className="w-full h-full">
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor={backgroundColor}
        nodeCanvasObject={paintNode}
        nodeCanvasObjectMode={() => "replace"}
        nodePointerAreaPaint={paintNodePointerArea}
        nodeRelSize={4}
        nodeVal={(n) => (n as GraphNode).val}
        nodeLabel=""
        linkColor={getLinkColor}
        linkWidth={getLinkWidth}
        d3VelocityDecay={0.4}
        d3AlphaDecay={0.02}
        cooldownTicks={100}
        onNodeClick={(node) => {
          const gn = node as GraphNode;
          if (onNodeClick) {
            onNodeClick(gn.id, gn.nodeKind);
          }
        }}
      />
    </div>
  );
}
