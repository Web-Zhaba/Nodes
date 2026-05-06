import React, { lazy, Suspense } from 'react';
import type { LucideProps } from 'lucide-react';
import dynamicIconImports from 'lucide-react/dynamicIconImports';

const fallbackIcon = dynamicIconImports['circle'];

interface DynamicIconProps extends Omit<LucideProps, 'ref'> {
  name?: string;
  fallback?: React.ReactNode;
}

// Конвертирует 'Activity' или 'BookOpen' в 'activity' или 'book-open'
const toKebabCase = (str: string) => 
  str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

const iconCache: Record<string, React.LazyExoticComponent<any>> = {};

export function DynamicIcon({ name, fallback, ...props }: DynamicIconProps) {
  const kebabName = name ? toKebabCase(name) : undefined;
  const iconName = (kebabName && kebabName in dynamicIconImports) ? kebabName : 'circle';

  if (!iconCache[iconName]) {
    iconCache[iconName] = lazy(dynamicIconImports[iconName as keyof typeof dynamicIconImports]);
  }

  const LucideIcon = iconCache[iconName];

  return (
    <Suspense fallback={fallback || <div className="animate-pulse bg-muted rounded-full" style={{ width: props.size || 24, height: props.size || 24 }} />}>
      <LucideIcon {...props} />
    </Suspense>
  );
}
