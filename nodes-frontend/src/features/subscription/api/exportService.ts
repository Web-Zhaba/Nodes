import { supabase } from '@/lib/supabase'

type ExportFormat = 'json' | 'csv'

const downloadBlob = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const impulsesToCsv = (impulses: Record<string, unknown>[]): string => {
  if (!impulses.length) return 'id,node_id,value,completed_at,created_at\n'
  const headers = ['id', 'node_id', 'value', 'completed_at', 'created_at']
  const rows = impulses.map(row =>
    headers.map(h => JSON.stringify(row[h] ?? '')).join(',')
  )
  return [headers.join(','), ...rows].join('\n')
}

/**
 * Экспортирует все данные пользователя в JSON или CSV.
 * Доступно только для Pro-пользователей.
 */
export const exportUserData = async (format: ExportFormat): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Пользователь не авторизован")

  // 1. Проверяем подписку еще раз на стороне API (защита от обхода UI)
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_pro, pro_expires_at')
    .eq('id', user.id)
    .single()

  const now = new Date()
  const expiresAt = profile?.pro_expires_at ? new Date(profile.pro_expires_at) : null
  const isPro = Boolean(profile?.is_pro) && (expiresAt === null || expiresAt > now)

  if (!isPro) {
    throw new Error("Экспорт данных доступен только в Pro-версии")
  }

  const timestamp = new Date().toISOString().slice(0, 10)

  // 2. Параллельно загружаем только данные ТЕКУЩЕГО пользователя
  // Для импульсов используем join, чтобы отфильтровать по user_id через таблицу nodes
  const [nodesRes, impulsesRes, coresRes, connectorsRes] = await Promise.all([
    supabase.from('nodes').select('*').eq('user_id', user.id).order('created_at'),
    supabase.from('impulses').select('*, nodes!inner(name, user_id)').eq('nodes.user_id', user.id).order('created_at'),
    supabase.from('cores').select('*').eq('user_id', user.id).order('created_at'),
    supabase.from('connectors').select('*').eq('user_id', user.id).order('created_at'),
  ])

  if (format === 'json') {
    const data = {
      exportedAt: new Date().toISOString(),
      nodes: nodesRes.data ?? [],
      impulses: impulsesRes.data ?? [],
      cores: coresRes.data ?? [],
      connectors: connectorsRes.data ?? [],
    }
    downloadBlob(
      JSON.stringify(data, null, 2),
      `nodes-export-${timestamp}.json`,
      'application/json'
    )
  } else {
    // CSV экспортирует только impulses — наиболее ценные данные для анализа
    const csv = impulsesToCsv((impulsesRes.data ?? []) as Record<string, unknown>[])
    downloadBlob(
      csv,
      `nodes-impulses-${timestamp}.csv`,
      'text/csv;charset=utf-8;'
    )
  }
}
