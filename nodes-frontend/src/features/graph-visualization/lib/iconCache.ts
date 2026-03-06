import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { Icons } from "@/lib/icons";

/**
 * Cache: "iconName::color::size" → OffscreenCanvas
 *
 * Each OffscreenCanvas contains a pre-rendered, colored Lucide icon
 * ready to be drawn via ctx.drawImage() in nodeCanvasObject.
 *
 * Approach: SVG → OffscreenCanvas
 * Lucide exports React components. We render each icon to an SVG string,
 * convert it to a data URI, load it as an Image, then paint it onto an
 * OffscreenCanvas. The canvas is then cached for O(1) access on each
 * animation frame, ensuring 60fps performance even with 100+ nodes.
 */
const cache = new Map<string, OffscreenCanvas>();

/**
 * Synchronously returns a cached OffscreenCanvas for a Lucide icon.
 *
 * The first call for a given key triggers async rendering and returns null.
 * On the next render frame the cached canvas will be available.
 * This prevents blocking the animation loop.
 *
 * @param iconName - Key from Icons dictionary (e.g. "Brain")
 * @param color    - Hex color string (e.g. "#6c63ff")
 * @param size     - Canvas size in pixels (e.g. 14)
 */
export function getIconCanvas(
  iconName: string,
  color: string,
  size: number
): OffscreenCanvas | null {
  const key = `${iconName}::${color}::${size}`;

  if (cache.has(key)) {
    return cache.get(key)!;
  }

  // Trigger async render — result will be cached for next frame
  void renderIconToCache(key, iconName, color, size);

  return null; // Not yet ready — caller should skip drawing this frame
}

async function renderIconToCache(
  key: string,
  iconName: string,
  color: string,
  size: number
): Promise<void> {
  // Guard: don't double-render the same key
  if (cache.has(key)) return;

  // Pre-populate with a placeholder so concurrent calls don't double-render
  const placeholder = new OffscreenCanvas(size, size);
  cache.set(key, placeholder);

  const IconComponent = Icons[iconName] ?? Icons["Circle"];

  // 1. Render Lucide React component to SVG string
  const svgString = renderToStaticMarkup(
    createElement(IconComponent, {
      color,
      width: size,
      height: size,
      strokeWidth: 1.5,
    } as React.SVGProps<SVGSVGElement>)
  );

  // 2. Create data URI
  const dataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;

  // 3. Load as Image
  const img = new Image(size, size);
  img.src = dataUri;

  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
    });
  } catch {
    // If image fails to load, leave the placeholder (blank canvas) in cache
    return;
  }

  // 4. Draw onto OffscreenCanvas
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.drawImage(img, 0, 0, size, size);

  // 5. Replace placeholder with the real canvas
  cache.set(key, canvas);
}

/**
 * Clears all cached icons. Call on unmount to free memory.
 */
export function clearIconCache(): void {
  cache.clear();
}
