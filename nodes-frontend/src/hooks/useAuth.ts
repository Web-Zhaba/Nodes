/**
 * Copyright (c) 2026 Web-Zhaba. All rights reserved.
 * Local-First Offline Guest Authentication Hook
 */

import { useEffect, useState } from 'react'
import { useLocalDatabase } from '@/store/useLocalDatabase'

const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000000"

// Minimal User type matching what the app expects
interface LocalUser {
  id: string
  email: string
  app_metadata: Record<string, any>
  user_metadata: Record<string, any>
  aud: string
  created_at: string
  confirmed_at: string
  email_confirmed_at: string
  phone: string
  role: string
  updated_at: string
  identities?: any[]
}

// Minimal Session type matching what the app expects
interface LocalSession {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
  user: LocalUser
  expires_at: number
}

// Mock User
const mockUser: LocalUser = {
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
}

// Mock Session
const mockSession: LocalSession = {
  access_token: "mock-local-token",
  token_type: "bearer",
  expires_in: 3153600000, // ~100 years
  refresh_token: "mock-local-refresh-token",
  user: mockUser,
  expires_at: Math.floor(Date.now() / 1000) + 3153600000,
}

export function useAuth() {
  const isHydrated = useLocalDatabase((state) => state.isHydrated)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isHydrated) {
      setIsLoading(false)
    }
  }, [isHydrated])

  return {
    session: isHydrated ? mockSession : null,
    user: isHydrated ? mockUser : null,
    isLoading,
    isAuthenticated: isHydrated,
  }
}
