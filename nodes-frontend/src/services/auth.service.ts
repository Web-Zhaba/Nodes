/**
 * Copyright (c) 2026 Web-Zhaba. All rights reserved.
 * Refactored to Local-First Offline Auth Service
 */

import { useLocalDatabase } from "@/store/useLocalDatabase";
import type { Session, User } from "@supabase/supabase-js";

const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000000";

const mockUser: User = {
  id: DEFAULT_USER_ID,
  email: "local_user@nodes.local",
  app_metadata: { provider: "local" },
  user_metadata: { display_name: "Локальный Проводник" },
  aud: "authenticated",
  created_at: new Date().toISOString(),
  confirmed_at: new Date().toISOString(),
  email_confirmed_at: new Date().toISOString(),
  phone: "",
  role: "authenticated",
  updated_at: new Date().toISOString(),
};

const mockSession: Session = {
  access_token: "mock-local-token",
  token_type: "bearer",
  expires_in: 3153600000,
  refresh_token: "mock-local-refresh-token",
  user: mockUser,
  expires_at: Math.floor(Date.now() / 1000) + 3153600000,
};

export const authService = {
  /**
   * Get current session
   */
  async getSession(): Promise<{ session: Session | null; error: any }> {
    return { session: mockSession, error: null };
  },

  /**
   * Log out
   */
  async signOut(): Promise<{ error: any }> {
    return { error: null };
  },

  /**
   * Log in with password
   */
  async signInWithPassword(_email: string, _password: string): Promise<{ data: any; error: any }> {
    return { data: { user: mockUser, session: mockSession }, error: null };
  },

  /**
   * Register
   */
  async signUp(_email: string, _password: string, _redirectTo?: string): Promise<{ data: any; error: any }> {
    return { data: { user: mockUser, session: mockSession }, error: null };
  },

  /**
   * Request password reset
   */
  async resetPasswordForEmail(_email: string, _redirectTo: string): Promise<{ error: any }> {
    return { error: null };
  },

  /**
   * Update password
   */
  async updatePassword(_password: string): Promise<{ data: any; error: any }> {
    return { data: { user: mockUser }, error: null };
  },

  /**
   * Terminate active sessions on other devices
   */
  async signOutOthers(): Promise<{ error: any }> {
    return { error: null };
  },

  /**
   * Get active sessions (mock)
   */
  async getActiveSessions(): Promise<{ data: any[]; error: any }> {
    return { data: [], error: null };
  },

  /**
   * OAuth login
   */
  async signInWithOAuth(_provider: "google" | "github"): Promise<{ error: any }> {
    return { error: null };
  },

  /**
   * Handle redirect callback
   */
  async handleAuthCallback(): Promise<{ type: "success" | "error" | "recovery" | "loading"; session?: Session | null; message?: string }> {
    return { type: "success", session: mockSession };
  },

  /**
   * Update local profile settings
   */
  async updateProfile(_userId: string, updates: any): Promise<{ data: any; error: any }> {
    try {
      useLocalDatabase.getState().updateProfile(updates);
      const profile = useLocalDatabase.getState().profile;
      return { data: profile, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  },
};
