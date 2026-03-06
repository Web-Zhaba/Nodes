import { useRef, useState, useEffect, useCallback } from "react";
import ForceGraph2D from "react-force-graph-2d";
import type { ForceGraphMethods, NodeObject } from "react-force-graph-2d";
import { getIconCanvas, clearIconCache } from "@/features/graph-visualization/lib/iconCache";
import type { GraphData, GraphNode, GraphLink } from "../model/types";

interface ForceGraphProps {
  graphData: GraphData;
  /** Background color — should match the page/panel background */
  backgroundColor?: string;
}

const CORE_RADIUS = 18;
const LABEL_FONT_SIZE = 5;    // px in graph-space (scales with zoom automatically)
const LABEL_OFFSET = 4;       // px gap between circle edge and label baseline
const ICON_PIXEL_RATIO = 4;   // render icons at 4x then downscale → sharp on HiDPI

export function ForceGraph({ graphData, backgroundColor = "transparent" }: ForceGraphProps) {
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
    // Set initial size immediately
    setDimensions({
      width: Math.floor(el.clientWidth),
      height: Math.floor(el.clientHeight),
    });

    return () => observer.disconnect();
  }, []);

  // ── Zoom to fit after data loads ─────────────────────────────────────────
  useEffect(() => {
    if (graphData.nodes.length === 0) return;
    const timer = setTimeout(() => {
      graphRef.current?.zoomToFit(500, 80);
    }, 400); // Let D3 settle first
    return () => clearTimeout(timer);
  }, [graphData]);

  // ── Configure D3 forces after graph mounts ───────────────────────────────
  const handleEngineStop = useCallback(() => {
    // noop — could save positions here in future
  }, []);

  useEffect(() => {
    const g = graphRef.current;
    if (!g) return;
    g.d3Force("charge")?.strength?.(-160);
    g.d3Force("link")?.distance?.(70);
  });

  // ── Cleanup icon cache on unmount ────────────────────────────────────────
  useEffect(() => {
    return () => clearIconCache();
  }, []);

  // ── Custom node painter ──────────────────────────────────────────────────
  const paintNode = useCallback(
    (rawNode: NodeObject, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const node = rawNode as GraphNode & { x: number; y: number };
      if (!node.x || !node.y) return; // skip during first tick

      const { x, y, nodeKind, icon, color, name } = node;
      const isCore = nodeKind === "core";
      const radius = isCore ? CORE_RADIUS : Math.max(4, node.val ?? 4);
      const iconSize = isCore ? 14 : 10;

      // ── 1. Circle fill ──────────────────────────────────────────────────
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color + (isCore ? "33" : "22");
      ctx.fill();

      // ── 2. Circle stroke ────────────────────────────────────────────────
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = color;
      ctx.lineWidth = isCore ? 2.5 : 1.5;
      ctx.stroke();

      // ── 3. Icon (OffscreenCanvas) ────────────────────────────────────────
      const pixelSize = iconSize * ICON_PIXEL_RATIO;
      const iconCanvas = getIconCanvas(icon, color, pixelSize);
      if (iconCanvas) {
        const half = iconSize / 2;
        ctx.drawImage(iconCanvas, x - half, y - half, iconSize, iconSize);
      }

      // ── 4. Label below circle ────────────────────────────────────────────
      const labelY = y + radius + LABEL_OFFSET;
      const fontSize = LABEL_FONT_SIZE / globalScale;

      ctx.font = isCore
        ? `bold ${fontSize}px Inter, system-ui, sans-serif`
        : `${fontSize}px Inter, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = isCore ? color : "rgba(255,255,255,0.7)";
      ctx.fillText(name, x, labelY);
    },
    []
  );

  // ── Link color accessor ──────────────────────────────────────────────────
  const getLinkColor = useCallback(
    (link: object) => (link as GraphLink).color,
    []
  );

  // ── Link width accessor ──────────────────────────────────────────────────
  const getLinkWidth = useCallback(
    (link: object) => ((link as GraphLink).kind === "node-core" ? 1.2 : 0.8),
    []
  );

  // ── Node pointer area (makes the label also clickable in future) ─────────
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
        // ── Node rendering ──────────────────────────────────────────────
        nodeCanvasObject={paintNode}
        nodeCanvasObjectMode={() => "replace"}
        nodePointerAreaPaint={paintNodePointerArea}
        nodeRelSize={4}
        nodeVal={(n) => (n as GraphNode).val}
        nodeLabel="" // disable built-in tooltip, labels are drawn manually
        // ── Link rendering ──────────────────────────────────────────────
        linkColor={getLinkColor}
        linkWidth={getLinkWidth}
        // ── D3 physics ──────────────────────────────────────────────────
        d3VelocityDecay={0.4}
        d3AlphaDecay={0.02}
        cooldownTicks={100}
        onEngineStop={handleEngineStop}
      />
    </div>
  );
}
