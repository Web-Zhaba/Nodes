import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { useThemeStore } from "@/store/useThemeStore";
import { config } from "@/config";

export const authService = {
  /**
   * Получение текущей сессии
   */
  async getSession(): Promise<{ session: Session | null, error: any }> {
    const { data, error } = await supabase.auth.getSession();
    return { session: data?.session ?? null, error };
  },

  /**
   * Выход из аккаунта
   */
  async signOut(): Promise<{ error: any }> {
    // Clear theme cache before logout
    useThemeStore.getState().clearCache();
    return await supabase.auth.signOut();
  },

  /**
   * Вход по паролю
   */
  async signInWithPassword(email: string, password: string): Promise<{ data: any, error: any }> {
    return await supabase.auth.signInWithPassword({ email, password });
  },

  /**
   * Регистрация
   */
  async signUp(email: string, password: string, redirectTo?: string): Promise<{ data: any, error: any }> {
    return await supabase.auth.signUp({
      email,
      password,
      ...(redirectTo && { options: { emailRedirectTo: redirectTo } })
    });
  },

  /**
   * Запрос на восстановление пароля
   */
  async resetPasswordForEmail(email: string, redirectTo: string): Promise<{ error: any }> {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
  },

  /**
   * Обновление пароля (после перехода по ссылке)
   */
  async updatePassword(password: string): Promise<{ data: any, error: any }> {
    return await supabase.auth.updateUser({ password });
  },

  /**
   * Выход на всех других устройствах
   */
  async signOutOthers(): Promise<{ error: any }> {
    return await supabase.auth.signOut({ scope: 'others' });
  },

  /**
   * Получение активных сессий (через RPC)
   */
  async getActiveSessions(): Promise<{ data: any[], error: any }> {
    const { data, error } = await supabase.rpc('get_active_sessions');
    if (error) return { data: [], error };
    return { data: data || [], error: null };
  },

  /**
   * Вход через OAuth (Google, GitHub и т.д.)
   */
  async signInWithOAuth(provider: 'google' | 'github'): Promise<{ error: any }> {
    if (Capacitor.isNativePlatform()) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          skipBrowserRedirect: true,
          redirectTo: 'nodes://auth/callback',
        },
      });
      if (error) return { error };
      if (data?.url) {
        await Browser.open({ url: data.url });
      }
      return { error: null };
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${config.siteUrl}/auth/callback`,
      },
    });
    return { error };
  },

  /**
   * Централизованная обработка callback после OAuth или сброса пароля
   */
  async handleAuthCallback() {
    const hash = window.location.hash;
    const params = new URLSearchParams(window.location.search);
    
    // 1. Проверка ошибок в URL
    const errorFromUrl = params.get('error') || new URLSearchParams(hash.substring(1)).get('error');
    if (errorFromUrl) {
      const errorDescription = params.get('error_description') || new URLSearchParams(hash.substring(1)).get('error_description');
      return { type: 'error', message: errorDescription || 'Ошибка аутентификации' };
    }

    // 2. Обработка кода авторизации
    const code = params.get('code');
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) return { type: 'error', message: error.message };
    }

    // 3. Проверка сессии
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) return { type: 'error', message: error.message };
    
    if (session) {
      const isRecovery = params.get('type') === 'recovery' || new URLSearchParams(hash.substring(1)).get('type') === 'recovery';
      return { 
        type: isRecovery ? 'recovery' : 'success', 
        session 
      };
    }

    return { type: 'loading' };
  },

  /**
   * Обновление профиля пользователя
   */
  async updateProfile(userId: string, updates: any): Promise<{ data: any, error: any }> {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();
    
    return { data, error };
  }
};
