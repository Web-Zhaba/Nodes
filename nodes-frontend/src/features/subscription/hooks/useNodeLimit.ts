import { useSubscription } from '../hooks/useSubscription'
import { useAuth } from '@/hooks/useAuth'
import { FREE_LIMITS } from '../types'
import { useNodesQuery } from '@/features/nodes/hooks/useNodesQuery'

/**
 * Хук для проверки лимита узлов.
 * Free: максимум 5 узлов. Pro: безлимит.
 */
export const useNodeLimit = () => {
  const { user } = useAuth()
  const { isPro } = useSubscription(user?.id)
  const { data: nodes = {} } = useNodesQuery(user?.id)

  const current = Object.keys(nodes).length
  const limit = FREE_LIMITS.nodes
  const isAtLimit = !isPro && current >= limit
  const canCreate = isPro || current < limit

  return { canCreate, isAtLimit, limit, current, isPro }
}
