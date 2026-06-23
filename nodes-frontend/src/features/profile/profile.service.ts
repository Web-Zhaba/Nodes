/**
 * Copyright (c) 2026 Web-Zhaba. All rights reserved.
 * Refactored to Local-First Offline Profile Service
 */

import { useLocalDatabase } from "@/store/useLocalDatabase";
import type { Profile } from "@/types";

export const profileService = {
  async getProfile(_userId: string): Promise<Profile | null> {
    try {
      return useLocalDatabase.getState().profile;
    } catch (error) {
      console.error("Offline getProfile error:", error);
      return null;
    }
  },

  async updateProfile(_userId: string, updates: Partial<Profile>): Promise<Profile | null> {
    try {
      useLocalDatabase.getState().updateProfile(updates);
      return useLocalDatabase.getState().profile;
    } catch (error) {
      console.error("Offline updateProfile error:", error);
      throw error;
    }
  },
};
