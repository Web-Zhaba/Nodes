/**
 * Copyright (c) 2026 Web-Zhaba. All rights reserved.
 * Refactored to Local-First Offline Core Service
 */

import { useLocalDatabase } from "@/store/useLocalDatabase";
import { recalculateCoreStability } from "@/lib/physics/stability";
import type { Core, CoreConnector } from "@/types";

/**
 * Get all cores of the user
 */
export async function getUserCores(_userId: string | undefined): Promise<Core[]> {
  try {
    return useLocalDatabase.getState().cores;
  } catch (error) {
    console.error("Offline getUserCores error:", error);
    return [];
  }
}

/**
 * Create a new Core
 */
export async function createCore(
  _userId: string,
  name: string,
  color: string,
  icon: string = "Circle"
): Promise<Core | null> {
  try {
    const core = useLocalDatabase.getState().addCore({
      name,
      color,
      icon,
    });
    return core;
  } catch (error) {
    console.error("Offline createCore error:", error);
    return null;
  }
}

/**
 * Update an existing Core
 */
export async function updateCore(
  coreId: string,
  updates: Partial<Pick<Core, "name" | "color" | "icon">>
): Promise<Core | null> {
  try {
    const success = useLocalDatabase.getState().updateCore(coreId, updates);
    if (!success) return null;
    return useLocalDatabase.getState().cores.find((c) => c.id === coreId) || null;
  } catch (error) {
    console.error("Offline updateCore error:", error);
    return null;
  }
}

/**
 * Delete a Core
 */
export async function deleteCore(coreId: string): Promise<boolean> {
  try {
    return useLocalDatabase.getState().deleteCore(coreId);
  } catch (error) {
    console.error("Offline deleteCore error:", error);
    return false;
  }
}

/**
 * Get all core connectors mappings
 */
export async function getUserCoreConnectors(): Promise<CoreConnector[]> {
  try {
    return useLocalDatabase.getState().coreConnectors;
  } catch (error) {
    console.error("Offline getUserCoreConnectors error:", error);
    return [];
  }
}

/**
 * Add or remove mapping between a Core and a Connector (tag)
 */
export async function toggleCoreConnector(
  coreId: string,
  connectorId: string,
  isLinked: boolean
): Promise<{ id: string } | null> {
  try {
    const state = useLocalDatabase.getState();
    const now = new Date().toISOString();

    if (isLinked) {
      const exists = state.coreConnectors.some(
        (cc) => cc.core_id === coreId && cc.connector_id === connectorId
      );

      if (exists) {
        const found = state.coreConnectors.find(
          (cc) => cc.core_id === coreId && cc.connector_id === connectorId
        );
        return { id: found?.id || "exists" };
      }

      const id = crypto.randomUUID();
      const newCC: CoreConnector = {
        id,
        core_id: coreId,
        connector_id: connectorId,
        created_at: now,
      };

      // Add to core connectors list
      const updatedCCs = [...state.coreConnectors, newCC];

      // Re-calculate the stability of this core
      const newStability = recalculateCoreStability(
        coreId,
        state.nodes,
        updatedCCs,
        state.nodeConnectors
      );

      const updatedCores = state.cores.map((c) =>
        c.id === coreId
          ? {
              ...c,
              stability_score: newStability,
              updated_at: now,
            }
          : c
      );

      useLocalDatabase.setState({
        coreConnectors: updatedCCs,
        cores: updatedCores,
      });

      return { id };
    } else {
      const updatedCCs = state.coreConnectors.filter(
        (cc) => !(cc.core_id === coreId && cc.connector_id === connectorId)
      );

      // Re-calculate stability after removal
      const newStability = recalculateCoreStability(
        coreId,
        state.nodes,
        updatedCCs,
        state.nodeConnectors
      );

      const updatedCores = state.cores.map((c) =>
        c.id === coreId
          ? {
              ...c,
              stability_score: newStability,
              updated_at: now,
            }
          : c
      );

      useLocalDatabase.setState({
        coreConnectors: updatedCCs,
        cores: updatedCores,
      });

      return { id: "removed" };
    }
  } catch (error) {
    console.error("Offline toggleCoreConnector error:", error);
    return null;
  }
}
