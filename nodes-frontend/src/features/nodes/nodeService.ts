/**
 * Copyright (c) 2026 Web-Zhaba. All rights reserved.
 * This file is part of Nodes and is proprietary software.
 * Refactored to Local-First Offline Database Service
 */

import { useLocalDatabase } from "@/store/useLocalDatabase";
import type { Node, CreateNodeData } from "@/types";

/**
 * Helper function to format Date object into YYYY-MM-DD
 */
function formatDateToSql(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get all nodes of the user
 */
export async function getUserNodes(_userId?: string): Promise<Node[]> {
  try {
    return useLocalDatabase.getState().nodes;
  } catch (error) {
    console.error("Offline getUserNodes error:", error);
    return [];
  }
}

/**
 * Create a new node with connectors
 */
export async function createNode(
  nodeData: CreateNodeData & { connector_ids?: string[] },
  _userId?: string
): Promise<Node | null> {
  try {
    const node = useLocalDatabase.getState().addNode(nodeData);
    return node;
  } catch (error) {
    console.error("Offline createNode error:", error);
    return null;
  }
}

/**
 * Update an existing node
 */
export async function updateNode(
  id: string,
  updates: Partial<Node> & { connector_ids?: string[] },
  _userId?: string
): Promise<boolean> {
  try {
    return useLocalDatabase.getState().updateNode(id, updates);
  } catch (error) {
    console.error("Offline updateNode error:", error);
    return false;
  }
}

/**
 * Delete a node
 */
export async function deleteNode(id: string): Promise<boolean> {
  try {
    return useLocalDatabase.getState().deleteNode(id);
  } catch (error) {
    console.error("Offline deleteNode error:", error);
    return false;
  }
}

/**
 * Get a node by ID
 */
export async function getNodeById(id: string): Promise<Node | null> {
  try {
    const node = useLocalDatabase.getState().nodes.find((n) => n.id === id);
    return node || null;
  } catch (error) {
    console.error("Offline getNodeById error:", error);
    return null;
  }
}

/**
 * Create an impulse (add execution progress)
 */
export async function createImpulse(
  nodeId: string,
  value: number = 1,
  date: Date = new Date()
): Promise<boolean> {
  try {
    const dateStr = formatDateToSql(date);
    const node = useLocalDatabase.getState().nodes.find((n) => n.id === nodeId);
    const isIncremental = node ? node.node_type === "binary" : true;
    return useLocalDatabase.getState().recordImpulse(nodeId, value, dateStr, isIncremental);
  } catch (error) {
    console.error("Offline createImpulse error:", error);
    return false;
  }
}

/**
 * Delete an impulse (remove execution progress)
 */
export async function deleteImpulse(
  nodeId: string,
  date: Date = new Date()
): Promise<boolean> {
  try {
    const dateStr = formatDateToSql(date);
    return useLocalDatabase.getState().cancelImpulse(nodeId, dateStr);
  } catch (error) {
    console.error("Offline deleteImpulse error:", error);
    return false;
  }
}

/**
 * Get impulses for a list of nodes on a specific date (Batch)
 */
export async function getImpulsesForDateBatch(nodeIds: string[], date: Date): Promise<any[]> {
  if (nodeIds.length === 0) return [];
  try {
    const dateStr = formatDateToSql(date);
    const impulses = useLocalDatabase.getState().impulses;
    return impulses.filter((i) => nodeIds.includes(i.node_id) && i.completed_at === dateStr);
  } catch (error) {
    console.error("Offline getImpulsesForDateBatch error:", error);
    return [];
  }
}

/**
 * Update quantity/duration absolute value for today
 */
export async function updateQuantityValue(
  nodeId: string,
  value: number,
  date: Date = new Date()
): Promise<boolean> {
  try {
    const dateStr = formatDateToSql(date);
    return useLocalDatabase.getState().recordImpulse(nodeId, value, dateStr, false);
  } catch (error) {
    console.error("Offline updateQuantityValue error:", error);
    return false;
  }
}

/**
 * Get node IDs in focus for a specific date
 */
export async function getDailyFocusNodeIds(date: Date, _userId?: string): Promise<string[]> {
  try {
    const dateStr = formatDateToSql(date);
    return useLocalDatabase.getState().getDailyFocusNodeIds(dateStr);
  } catch (error) {
    console.error("Offline getDailyFocusNodeIds error:", error);
    return [];
  }
}

/**
 * Set node IDs in focus for a specific date
 */
export async function setDailyFocusNodes(nodeIds: string[], date: Date, _userId?: string): Promise<boolean> {
  try {
    const dateStr = formatDateToSql(date);
    return useLocalDatabase.getState().setDailyFocusNodes(nodeIds, dateStr);
  } catch (error) {
    console.error("Offline setDailyFocusNodes error:", error);
    return false;
  }
}
