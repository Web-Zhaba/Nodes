import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

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
  }
};
