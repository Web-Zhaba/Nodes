import { useSubscription } from '../hooks/useSubscription'
import { useAuth } from '@/hooks/useAuth'
import { FREE_LIMITS } from '../types'
import { useCoresQuery } from '@/features/core-management/hooks/useCoresQuery'

/**
 * Хук для проверки лимита ядер.
 * Free: максимум 5 ядер. Pro: безлимит.
 */
export const useCoreLimit = () => {
  const { user } = useAuth()
  const { isPro } = useSubscription(user?.id)
  const { data: cores = {} } = useCoresQuery(user?.id)

  const current = Object.keys(cores).length
  const limit = FREE_LIMITS.cores
  const isAtLimit = !isPro && current >= limit
  const canCreate = isPro || current < limit

  return { canCreate, isAtLimit, limit, current, isPro }
}
