import { supabase } from './supabase';

const DJANGO_API_URL = import.meta.env.VITE_DJANGO_API_URL || 'http://localhost:8000/api/v1';
const TIMEOUT_MS = 10_000; // 10 секунд — если Django завис, отменяем запрос

export async function calculateStability(
  nodeId?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return { success: false, error: 'No active session' };
  }

  // AbortController позволяет отменить запрос по таймауту
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${DJANGO_API_URL}/stability/calculate/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ node_id: nodeId }),
      signal: controller.signal, // Привязываем сигнал отмены
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };

  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.warn('Django API: запрос отменен по таймауту (>10s)');
      return { success: false, error: 'timeout' };
    }
    console.error('Django API Error:', err.message);
    return { success: false, error: err.message };
  } finally {
    clearTimeout(timeoutId); // Всегда чистим таймаут
  }
}
