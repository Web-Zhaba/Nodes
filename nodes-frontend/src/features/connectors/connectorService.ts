/**
 * Copyright (c) 2026 Web-Zhaba. All rights reserved.
 * Refactored to Local-First Offline Connector/Tag Service
 */

import { useLocalDatabase } from "@/store/useLocalDatabase";
import type { Connector } from "@/types";

/**
 * Get all connectors of the user
 */
export async function getUserConnectors(_userId?: string): Promise<Connector[]> {
  try {
    return useLocalDatabase.getState().connectors;
  } catch (error) {
    console.error("Offline getUserConnectors error:", error);
    return [];
  }
}

/**
 * Create a new connector
 */
export async function createConnector(
  name: string,
  options?: {
    description?: string;
    color?: string;
    is_mainline?: boolean;
  },
  _userId?: string
): Promise<Connector | null> {
  try {
    const connector = useLocalDatabase.getState().addConnector(
      name,
      options?.color,
      options?.is_mainline,
      options?.description
    );
    return connector;
  } catch (error) {
    console.error("Offline createConnector error:", error);
    return null;
  }
}
