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

export function DynamicIcon({ name, fallback, ...props }: DynamicIconProps) {
  const kebabName = name ? toKebabCase(name) : undefined;

  if (!kebabName || !(kebabName in dynamicIconImports)) {
    const FallbackIcon = lazy(fallbackIcon);
    return (
      <Suspense fallback={fallback || <div style={{ width: props.size, height: props.size }} />}>
        <FallbackIcon {...props} />
      </Suspense>
    );
  }

  const LucideIcon = lazy(dynamicIconImports[kebabName as keyof typeof dynamicIconImports]);

  return (
    <Suspense fallback={fallback || <div style={{ width: props.size, height: props.size }} />}>
      <LucideIcon {...props} />
    </Suspense>
  );
}
