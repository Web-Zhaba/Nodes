import { renderToStaticMarkup } from "react-dom/server";
import React, { createElement } from "react";
import dynamicIconImports from 'lucide-react/dynamicIconImports';

const toKebabCase = (str: string) => 
  str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

/**
 * Cache: "iconName::color::size" → OffscreenCanvas
 */
const cache = new Map<string, OffscreenCanvas>();

/**
 * Synchronously returns a cached OffscreenCanvas for a Lucide icon.
 * Returns null if not cached, triggering async render.
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

  return null;
}

async function renderIconToCache(
  key: string,
  iconName: string,
  color: string,
  size: number
): Promise<void> {
  if (cache.has(key)) return;

  // Placeholder
  const placeholder = new OffscreenCanvas(size, size);
  cache.set(key, placeholder);

  try {
    const kebabName = toKebabCase(iconName);
    const loadIcon = dynamicIconImports[kebabName as keyof typeof dynamicIconImports] || dynamicIconImports['circle'];
    const IconModule = await loadIcon();
    const IconComponent = IconModule.default;

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

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
    });

    // 4. Draw onto OffscreenCanvas
    const canvas = new OffscreenCanvas(size, size);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, size, size);

    cache.set(key, canvas);
  } catch (err) {
    console.error(`Failed to render icon ${iconName} to cache:`, err);
  }
}

export function clearIconCache(): void {
  cache.clear();
}

