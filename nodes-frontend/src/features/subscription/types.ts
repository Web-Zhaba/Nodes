// ============================================================
// Subscription types — Free / Pro plan
// ============================================================

export type SubscriptionPlan = 'free' | 'pro'

export interface SubscriptionStatus {
  isPro: boolean
  plan: SubscriptionPlan
  expiresAt: string | null
}

// Набор фич, защищённых Pro-планом
export type ProFeature =
  | 'themes'          // Кастомные темы (кроме Default)
  | 'analytics_history' // История аналитики > 7 дней
  | 'export'          // Экспорт данных CSV/JSON
  | 'nodes_limit'     // Создание > 20 узлов
  | 'cores_limit'     // Создание > 5 ядер

export const FREE_LIMITS = {
  nodes: 10,
  cores: 3,
  analyticsDays: 30,
} as const

export const SUBSCRIPTION_PACKAGES = [
  { id: '1m', months: 1,  price: 199,  discount: 0 },
  { id: '3m', months: 3,  price: 537,  discount: 10 }, // 199 * 3 * 0.90 = 537.3 -> 537
  { id: '6m', months: 6,  price: 1015, discount: 15 }, // 199 * 6 * 0.85 = 1014.9 -> 1015
  { id: '1y', months: 12, price: 1910, discount: 20 }, // 199 * 12 * 0.80 = 1910.4 -> 1910
] as const

export type SubscriptionPackageId = (typeof SUBSCRIPTION_PACKAGES)[number]['id']

export const PRO_LIMITS = {
  nodes: Infinity,
  cores: Infinity,
  analyticsDays: 365,
} as const
