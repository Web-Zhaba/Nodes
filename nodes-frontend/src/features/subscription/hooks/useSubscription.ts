/**
 * Copyright (c) 2026 Web-Zhaba. All rights reserved.
 * Refactored to Local-First Offline Subscription Hook
 */

import { useQuery } from "@tanstack/react-query";
import { useLocalDatabase } from "@/store/useLocalDatabase";
import type { SubscriptionStatus } from "../types";

const fetchSubscriptionStatus = async (_userId: string): Promise<SubscriptionStatus> => {
  const profile = useLocalDatabase.getState().profile;
  const isPro = profile.is_pro ?? true;

  return {
    isPro: isPro,
    plan: isPro ? "pro" : "free",
    expiresAt: null,
  };
};

/**
 * Hook for checking user subscription status local-first
 */
export const useSubscription = (userId?: string) => {
  const query = useQuery({
    queryKey: ["subscription", userId],
    queryFn: () => fetchSubscriptionStatus(userId!),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
  });

  return {
    isPro: query.data?.isPro ?? true,
    plan: query.data?.plan ?? "pro",
    expiresAt: query.data?.expiresAt ?? null,
    isLoading: query.isLoading,
  };
};
