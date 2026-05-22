import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { SubscriptionStatus } from '../types'

const fetchSubscriptionStatus = async (userId: string): Promise<SubscriptionStatus> => {

  const { data, error } = await supabase
    .from('profiles')
    .select('is_pro, pro_expires_at, subscription_plan')
    .eq('id', userId)
    .single()

  if (error) throw error

  const now = new Date()
  const expiresAt = data?.pro_expires_at ? new Date(data.pro_expires_at) : null
  // is_pro = true, и либо нет даты истечения (бессрочно), либо дата в будущем
  const isPro = Boolean(data?.is_pro) && (expiresAt === null || expiresAt > now)

  return {
    isPro,
    plan: isPro ? 'pro' : 'free',
    expiresAt: data?.pro_expires_at ?? null,
  }
}

/**
 * Хук для получения статуса подписки пользователя.
 * Кэшируется на 5 минут, refetch при фокусе окна отключён.
 */
export const useSubscription = (userId?: string) => {
  const query = useQuery({
    queryKey: ['subscription', userId],
    queryFn: () => fetchSubscriptionStatus(userId!),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
  })

  return {
    isPro: query.data?.isPro ?? false,
    plan: query.data?.plan ?? 'free',
    expiresAt: query.data?.expiresAt ?? null,
    isLoading: query.isLoading,
  }
}
