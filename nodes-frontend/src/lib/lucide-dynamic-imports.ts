import { type LucideIcon } from 'lucide-react';

type IconImport = () => Promise<{ default: LucideIcon }>;

/**
 * Trimmed dynamic import map for Lucide icons.
 * Only includes icons used by the app's IconPicker and static DynamicIcon usages.
 * This avoids bundling all 1000+ lucide icons via the official dynamicIconImports map.
 */
const iconImports: Record<string, IconImport> = {
  // Активность и спорт
  'activity': () => import('lucide-react/dist/esm/icons/activity'),
  'dumbbell': () => import('lucide-react/dist/esm/icons/dumbbell'),
  'footprints': () => import('lucide-react/dist/esm/icons/footprints'),
  'heart': () => import('lucide-react/dist/esm/icons/heart'),
  'zap': () => import('lucide-react/dist/esm/icons/zap'),
  'flame': () => import('lucide-react/dist/esm/icons/flame'),

  // Ментальное
  'brain': () => import('lucide-react/dist/esm/icons/brain'),
  'sparkles': () => import('lucide-react/dist/esm/icons/sparkles'),
  'lightbulb': () => import('lucide-react/dist/esm/icons/lightbulb'),
  'eye': () => import('lucide-react/dist/esm/icons/eye'),
  'smile': () => import('lucide-react/dist/esm/icons/smile'),

  // Время и тайминг
  'timer': () => import('lucide-react/dist/esm/icons/timer'),
  'clock': () => import('lucide-react/dist/esm/icons/clock'),
  'calendar': () => import('lucide-react/dist/esm/icons/calendar'),
  'sun': () => import('lucide-react/dist/esm/icons/sun'),
  'moon': () => import('lucide-react/dist/esm/icons/moon'),
  'sunrise': () => import('lucide-react/dist/esm/icons/sunrise'),
  'sunset': () => import('lucide-react/dist/esm/icons/sunset'),

  // Еда и вода
  'droplet': () => import('lucide-react/dist/esm/icons/droplet'),
  'coffee': () => import('lucide-react/dist/esm/icons/coffee'),
  'utensils': () => import('lucide-react/dist/esm/icons/utensils'),
  'apple': () => import('lucide-react/dist/esm/icons/apple'),
  'cup-soda': () => import('lucide-react/dist/esm/icons/cup-soda'),

  // Обучение и работа
  'book': () => import('lucide-react/dist/esm/icons/book'),
  'book-open': () => import('lucide-react/dist/esm/icons/book-open'),
  'pen-tool': () => import('lucide-react/dist/esm/icons/pen-tool'),
  'target': () => import('lucide-react/dist/esm/icons/target'),
  'briefcase': () => import('lucide-react/dist/esm/icons/briefcase'),

  // Дом и быт
  'home': () => import('lucide-react/dist/esm/icons/home'),
  'bed': () => import('lucide-react/dist/esm/icons/bed'),
  'bath': () => import('lucide-react/dist/esm/icons/bath'),
  'brush': () => import('lucide-react/dist/esm/icons/brush'),
  'key': () => import('lucide-react/dist/esm/icons/key'),

  // Музыка и творчество
  'music': () => import('lucide-react/dist/esm/icons/music'),
  'palette': () => import('lucide-react/dist/esm/icons/palette'),
  'camera': () => import('lucide-react/dist/esm/icons/camera'),
  'headphones': () => import('lucide-react/dist/esm/icons/headphones'),
  'mic': () => import('lucide-react/dist/esm/icons/mic'),

  // Природа
  'tree-pine': () => import('lucide-react/dist/esm/icons/tree-pine'),
  'flower': () => import('lucide-react/dist/esm/icons/flower'),
  'cloud': () => import('lucide-react/dist/esm/icons/cloud'),
  'wind': () => import('lucide-react/dist/esm/icons/wind'),
  'mountain': () => import('lucide-react/dist/esm/icons/mountain'),

  // Разное
  'circle': () => import('lucide-react/dist/esm/icons/circle'),
  'star': () => import('lucide-react/dist/esm/icons/star'),
  'trophy': () => import('lucide-react/dist/esm/icons/trophy'),
  'award': () => import('lucide-react/dist/esm/icons/award'),
  'gem': () => import('lucide-react/dist/esm/icons/gem'),
  'anchor': () => import('lucide-react/dist/esm/icons/anchor'),
  'compass': () => import('lucide-react/dist/esm/icons/compass'),

  // Static usages outside IconPicker
  'bar-chart-3': () => import('lucide-react/dist/esm/icons/bar-chart-3'),
  'check': () => import('lucide-react/dist/esm/icons/check'),
  'settings': () => import('lucide-react/dist/esm/icons/settings'),
  'layers': () => import('lucide-react/dist/esm/icons/layers'),
  'search': () => import('lucide-react/dist/esm/icons/search'),
  'chevron-down': () => import('lucide-react/dist/esm/icons/chevron-down'),
};

export default iconImports;
