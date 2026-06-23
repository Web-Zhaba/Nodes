/**
 * Copyright (c) 2026 Web-Zhaba. All rights reserved.
 * Local-First Offline Guest Authentication Hook
 */

import { useEffect, useState } from 'react';
import { useLocalDatabase } from '@/store/useLocalDatabase';
import type { User, Session } from '@supabase/supabase-js';

const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000000";

// Mock User matching Supabase's format
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

// Mock Session matching Supabase's format
const mockSession: Session = {
  access_token: "mock-local-token",
  token_type: "bearer",
  expires_in: 3153600000, // ~100 years
  refresh_token: "mock-local-refresh-token",
  user: mockUser,
  expires_at: Math.floor(Date.now() / 1000) + 3153600000,
};

export function useAuth() {
  const isHydrated = useLocalDatabase((state) => state.isHydrated);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isHydrated) {
      setIsLoading(false);
    }
  }, [isHydrated]);

  return {
    session: isHydrated ? mockSession : null,
    user: isHydrated ? mockUser : null,
    isLoading,
    isAuthenticated: isHydrated,
  };
}
