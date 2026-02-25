import { supabase } from './supabase'

/**
 * Проверка подключения к Supabase
 */
export async function checkSupabaseConnection() {
  const result = {
    connected: false,
    user: null as { id: string; email: string } | null,
    tables: {
      profiles: false,
      nodes: false,
      impulses: false,
      connections: false,
    },
    error: null as string | null,
  }

  try {
    // 1. Проверка состояния сессии
    const { data: { session } } = await supabase.auth.getSession()

    if (session) {
      result.user = {
        id: session.user.id,
        email: session.user.email || '',
      }
    }

    // 2. Проверка таблиц через запрос к profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(1)

    if (profilesError) {
      throw new Error(`Profiles table: ${profilesError.message}`)
    }
    result.tables.profiles = true

    // 3. Проверка таблицы nodes
    const { error: nodesError } = await supabase
      .from('nodes')
      .select('id')
      .limit(1)

    if (nodesError) {
      throw new Error(`Nodes table: ${nodesError.message}`)
    }
    result.tables.nodes = true

    // 4. Проверка таблицы impulses
    const { error: impulsesError } = await supabase
      .from('impulses')
      .select('id')
      .limit(1)

    if (impulsesError) {
      throw new Error(`Impulses table: ${impulsesError.message}`)
    }
    result.tables.impulses = true

    // 5. Проверка таблицы connections
    const { error: connectionsError } = await supabase
      .from('connections')
      .select('id')
      .limit(1)

    if (connectionsError) {
      throw new Error(`Connections table: ${connectionsError.message}`)
    }
    result.tables.connections = true

    result.connected = true
  } catch (err) {
    result.error = err instanceof Error ? err.message : 'Unknown error'
  }

  return result
}
