import { supabase } from '@/lib/supabase'

export interface ApiKey {
  id: string
  name: string
  is_active: boolean
  last_used_at: string | null
  created_at: string
}

export interface ApiKeyWithSecret extends ApiKey {
  api_key: string
}

const DJANGO_API_URL = import.meta.env.VITE_DJANGO_API_URL || 'http://127.0.0.1:8000/api/v1'

/**
 * Сервис для управления API-ключами.
 */
export const integrationsService = {
  /**
   * Получает список ключей пользователя.
   */
  async getApiKeys(): Promise<ApiKey[]> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error("Unauthorized")

    const response = await fetch(`${DJANGO_API_URL}/keys/`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Failed to fetch API keys")
    }

    return response.json()
  },

  /**
   * Генерирует новый API-ключ.
   */
  async createApiKey(name: string): Promise<ApiKeyWithSecret> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error("Unauthorized")

    const response = await fetch(`${DJANGO_API_URL}/keys/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || error.message || "Failed to create API key")
    }

    return response.json()
  },

  /**
   * Удаляет (аннулирует) API-ключ.
   */
  async deleteApiKey(id: string): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error("Unauthorized")

    const response = await fetch(`${DJANGO_API_URL}/keys/${id}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Failed to delete API key")
    }
  }
}
