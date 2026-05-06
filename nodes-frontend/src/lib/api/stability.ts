import { supabase } from '../supabase';

const DJANGO_API_URL = import.meta.env.VITE_DJANGO_API_URL || 'http://127.0.0.1:8000/api/v1';
export const TIMEOUT_MS = 10_000; // 10 секунд — если Django завис, отменяем запрос

export async function calculateStability(
  nodeId?: string
): Promise<{ success: boolean; data?: any; error?: string; backendMs?: string }> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return { success: false, error: 'No active session' };
  }

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
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const backendMs = response.headers.get('X-Backend-Runtime-MS') || 'unknown';
    return { success: true, data, backendMs };

  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.warn('Django API: запрос отменен по таймауту (>10s)');
      return { success: false, error: 'timeout' };
    }
    console.error('Django API Error:', err.message);
    return { success: false, error: err.message };
  } finally {
    clearTimeout(timeoutId);
  }
}

let cachedSession: { token: string; expires: number } | null = null;

export async function getAuthToken() {
  const now = Date.now();
  if (cachedSession && cachedSession.expires > now) {
    return cachedSession.token;
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    cachedSession = {
      token: session.access_token,
      expires: now + 60 * 1000
    };
    return session.access_token;
  }
  return null;
}

export async function recordImpulse(nodeId: string, value: number, date: string): Promise<{ success: boolean; new_stability_score?: number; backendMs?: number; error?: string }> {
  try {
    const token = await getAuthToken();

    if (!token) {
      console.warn('No active session, cannot send impulse to Django.');
      return { success: false, error: 'No auth' };
    }

    const payload = {
      node_id: nodeId,
      value: value,
      date: date
    };

    const response = await fetch(`${DJANGO_API_URL}/impulses/action/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const runtimeMsStr = response.headers.get("X-Backend-Runtime-MS");
    const runtimeMs = runtimeMsStr ? parseFloat(runtimeMsStr) : undefined;
    
    if (!response.ok) {
      const errPayload = await response.json().catch(() => ({}));
      console.error('Django API Impulse Error:', response.status, errPayload);
      return { success: false, backendMs: runtimeMs };
    }
    
    const data = await response.json();
    return { success: true, new_stability_score: data.new_stability_score, backendMs: runtimeMs };

  } catch (error) {
    console.error('Fetch error (Django API):', error);
    return { success: false, error: String(error) };
  }
}
