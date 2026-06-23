/**
 * Copyright (c) 2026 Web-Zhaba. All rights reserved.
 * Local-First IndexedDB Database Store using Zustand and idb-keyval
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { get, set as idbSet, del } from "idb-keyval";
import { recalculateNodeStability, recalculateCoreStability } from "@/lib/physics/stability";
import type { Node, Core, Connector, CoreConnector, NodeConnector, Impulse, Profile, CreateNodeData } from "@/types";

// Custom IndexedDB storage provider for Zustand persist middleware
const indexedDBStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await idbSet(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000000";

const createDefaultProfile = (): Profile => ({
  id: DEFAULT_USER_ID,
  email: "local_user@nodes.local",
  display_name: "Локальный Проводник",
  daily_reset_time: "00:00",
  first_day_of_week: 1,
  language: "ru",
  show_greeting: true,
  custom_greeting: "Привет, {name}",
  theme_config: {},
  onboarding_completed: true,
  is_public: false,
  public_slug: "",
  bio: "",
  show_recommendations: false,
  is_pro: true, // PRO-функции бесплатны по умолчанию в оффлайне
  subscription_plan: "pro",
  pro_expires_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

interface LocalDatabaseState {
  profile: Profile;
  nodes: Node[];
  cores: Core[];
  connectors: Connector[];
  coreConnectors: CoreConnector[];
  nodeConnectors: NodeConnector[];
  impulses: Impulse[];
  dailyFocus: { id: string; user_id: string; node_id: string; focus_date: string; created_at: string }[];
  wikiPages: Record<string, string>;
  lastDecayDate: string;
  isHydrated: boolean;

  // Hydration indicator
  setHydrated: (hydrated: boolean) => void;
  checkAndApplyDailyDecay: () => void;

  // Profile actions
  updateProfile: (updates: Partial<Profile>) => void;

  // Node CRUD
  addNode: (nodeData: CreateNodeData & { connector_ids?: string[] }) => Node;
  updateNode: (id: string, updates: Partial<Node> & { connector_ids?: string[] }) => boolean;
  deleteNode: (id: string) => boolean;

  // Core CRUD
  addCore: (coreData: { name: string; description?: string; color: string; icon?: string; connector_ids?: string[] }) => Core;
  updateCore: (id: string, updates: Partial<Core> & { connector_ids?: string[] }) => boolean;
  deleteCore: (id: string) => boolean;

  // Connector CRUD
  addConnector: (name: string, color?: string, is_mainline?: boolean, description?: string) => Connector;
  updateConnector: (id: string, updates: Partial<Connector>) => boolean;
  deleteConnector: (id: string) => boolean;

  // Impulse Actions
  recordImpulse: (nodeId: string, value: number, dateStr: string, isIncremental?: boolean) => boolean;
  cancelImpulse: (nodeId: string, dateStr: string) => boolean;
  getImpulsesForNodeAndDate: (nodeId: string, dateStr: string) => Impulse[];
  updateImpulseComment: (nodeId: string, dateStr: string, comment: string) => boolean;

  // Wiki Pages Actions
  updateWikiPage: (title: string, content: string) => void;
  deleteWikiPage: (title: string) => void;

  // Daily Focus
  getDailyFocusNodeIds: (dateStr: string) => string[];
  setDailyFocusNodes: (nodeIds: string[], dateStr: string) => boolean;

  // Backup
  exportData: () => string;
  importData: (jsonString: string) => boolean;
  clearDatabase: () => void;
  recalculateAllDecay: () => void;
}

export const useLocalDatabase = create<LocalDatabaseState>()(
  persist(
    (set, get) => ({
      profile: createDefaultProfile(),
      nodes: [],
      cores: [],
      connectors: [],
      coreConnectors: [],
      nodeConnectors: [],
      impulses: [],
      dailyFocus: [],
      wikiPages: {
        "Главная": "# База знаний NODES\n\nДобро пожаловать в вашу децентрализованную цифровую систему!\n\nЗдесь вы можете объединять свои действия, правила и заметки в единую паутину.\n\n### Инструкция:\n1. Вы можете использовать **Вики-ссылки** вида `[[Название Узла]]` или `[[Название Страницы]]` для связывания заметок.\n2. Кликая по ссылкам, вы будете мгновенно переходить к соответствующим страницам или узлам.\n\nПопробуйте связать страницу с вашими существующими узлами!",
      },
      lastDecayDate: "",
      isHydrated: false,

      setHydrated: (hydrated) => set({ isHydrated: hydrated }),

      checkAndApplyDailyDecay: () => {
        const todayStr = new Date().toLocaleDateString("sv"); // format 'YYYY-MM-DD'
        const { lastDecayDate, recalculateAllDecay } = get();

        if (!lastDecayDate) {
          set({ lastDecayDate: todayStr });
          return;
        }

        if (lastDecayDate !== todayStr) {
          console.log(`[Nodes Physics] Local calendar day changed from ${lastDecayDate} to ${todayStr}. Applying decay...`);
          recalculateAllDecay();
          set({ lastDecayDate: todayStr });
        }
      },

      updateProfile: (updates) => {
        set((state) => ({
          profile: {
            ...state.profile,
            ...updates,
            updated_at: new Date().toISOString(),
          },
        }));
      },

      addNode: (nodeData) => {
        const id = crypto.randomUUID();
        const { connector_ids, ...fields } = nodeData;
        const now = new Date().toISOString();

        const newNode: Node = {
          ...fields,
          id,
          user_id: DEFAULT_USER_ID,
          stability_score: 0,
          completion_count: 0,
          category: "default",
          frequency: "daily",
          created_at: now,
          updated_at: now,
          connector_ids: connector_ids || [],
          mass: fields.mass ?? 1.0,
          is_focus_default: fields.is_focus_default ?? false,
        };

        const newNodeConnectors: NodeConnector[] = (connector_ids || []).map((connId) => ({
          id: crypto.randomUUID(),
          node_id: id,
          connector_id: connId,
          created_at: now,
        }));

        set((state) => ({
          nodes: [...state.nodes, newNode],
          nodeConnectors: [...state.nodeConnectors, ...newNodeConnectors],
        }));

        return newNode;
      },

      updateNode: (id, updates) => {
        const { connector_ids, ...fields } = updates;
        const now = new Date().toISOString();

        set((state) => {
          const updatedNodes = state.nodes.map((n) => {
            if (n.id === id) {
              return {
                ...n,
                ...fields,
                connector_ids: connector_ids !== undefined ? connector_ids : n.connector_ids,
                updated_at: now,
              };
            }
            return n;
          });

          let updatedNodeConnectors = [...state.nodeConnectors];
          if (connector_ids !== undefined) {
            // Remove old connectors and insert new ones
            updatedNodeConnectors = updatedNodeConnectors.filter((nc) => nc.node_id !== id);
            const newNodeConnectors: NodeConnector[] = connector_ids.map((connId) => ({
              id: crypto.randomUUID(),
              node_id: id,
              connector_id: connId,
              created_at: now,
            }));
            updatedNodeConnectors.push(...newNodeConnectors);
          }

          return {
            nodes: updatedNodes,
            nodeConnectors: updatedNodeConnectors,
          };
        });

        // Trigger stability update in case core attachments changed
        get().recordImpulse(id, 0, new Date().toISOString().split("T")[0], false);
        return true;
      },

      deleteNode: (id) => {
        set((state) => ({
          nodes: state.nodes.filter((n) => n.id !== id),
          nodeConnectors: state.nodeConnectors.filter((nc) => nc.node_id !== id),
          impulses: state.impulses.filter((i) => i.node_id !== id),
          dailyFocus: state.dailyFocus.filter((df) => df.node_id !== id),
        }));
        return true;
      },

      addCore: (coreData) => {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const { connector_ids, ...fields } = coreData;

        const newCore: Core = {
          ...fields,
          id,
          user_id: DEFAULT_USER_ID,
          stability_score: 0,
          is_public: false,
          created_at: now,
          updated_at: now,
        };

        const newCoreConnectors: CoreConnector[] = (connector_ids || []).map((connId) => ({
          id: crypto.randomUUID(),
          core_id: id,
          connector_id: connId,
          created_at: now,
        }));

        set((state) => ({
          cores: [...state.cores, newCore],
          coreConnectors: [...state.coreConnectors, ...newCoreConnectors],
        }));

        return newCore;
      },

      updateCore: (id, updates) => {
        const { connector_ids, ...fields } = updates;
        const now = new Date().toISOString();

        set((state) => {
          const updatedCores = state.cores.map((c) => {
            if (c.id === id) {
              return {
                ...c,
                ...fields,
                updated_at: now,
              };
            }
            return c;
          });

          let updatedCoreConnectors = [...state.coreConnectors];
          if (connector_ids !== undefined) {
            updatedCoreConnectors = updatedCoreConnectors.filter((cc) => cc.core_id !== id);
            const newCoreConnectors: CoreConnector[] = connector_ids.map((connId) => ({
              id: crypto.randomUUID(),
              core_id: id,
              connector_id: connId,
              created_at: now,
            }));
            updatedCoreConnectors.push(...newCoreConnectors);
          }

          return {
            cores: updatedCores,
            coreConnectors: updatedCoreConnectors,
          };
        });

        return true;
      },

      deleteCore: (id) => {
        set((state) => ({
          cores: state.cores.filter((c) => c.id !== id),
          coreConnectors: state.coreConnectors.filter((cc) => cc.core_id !== id),
          // Unlink nodes from this deleted core
          nodes: state.nodes.map((n) => (n.core_id === id ? { ...n, core_id: undefined } : n)),
        }));
        return true;
      },

      addConnector: (name, color, is_mainline, description) => {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        const newConnector: Connector = {
          id,
          user_id: DEFAULT_USER_ID,
          name: name.replace(/^#/, ""),
          color: color || "#22c55e",
          is_mainline: is_mainline || false,
          description: description || "",
          created_at: now,
          updated_at: now,
        };

        set((state) => ({
          connectors: [...state.connectors, newConnector],
        }));

        return newConnector;
      },

      updateConnector: (id, updates) => {
        const now = new Date().toISOString();
        set((state) => ({
          connectors: state.connectors.map((c) =>
            c.id === id ? { ...c, ...updates, name: updates.name ? updates.name.replace(/^#/, "") : c.name, updated_at: now } : c
          ),
        }));
        return true;
      },

      deleteConnector: (id) => {
        set((state) => ({
          connectors: state.connectors.filter((c) => c.id !== id),
          coreConnectors: state.coreConnectors.filter((cc) => cc.connector_id !== id),
          nodeConnectors: state.nodeConnectors.filter((nc) => nc.connector_id !== id),
        }));
        return true;
      },

      recordImpulse: (nodeId, value, dateStr, isIncremental = true) => {
        let completionDelta = 0;

        set((state) => {
          const existingIndex = state.impulses.findIndex(
            (i) => i.node_id === nodeId && i.completed_at === dateStr
          );

          let updatedImpulses = [...state.impulses];

          if (value <= 0) {
            // Delete impulse
            if (existingIndex > -1) {
              const impulse = updatedImpulses[existingIndex];
              const prevVal = Number(impulse.value);
              if (prevVal > 0) {
                completionDelta = -1;
              }
              
              if (!impulse.comment || impulse.comment.trim() === "") {
                updatedImpulses.splice(existingIndex, 1);
              } else {
                updatedImpulses[existingIndex] = {
                  ...impulse,
                  value: 0,
                  created_at: new Date().toISOString(),
                };
              }
            }
          } else {
            // Upsert impulse
            if (existingIndex > -1) {
              const prevVal = Number(updatedImpulses[existingIndex].value);
              if (prevVal === 0) {
                completionDelta = 1;
              }
              updatedImpulses[existingIndex] = {
                ...updatedImpulses[existingIndex],
                value: isIncremental ? prevVal + value : value,
                created_at: new Date().toISOString(),
              };
            } else {
              updatedImpulses.push({
                id: crypto.randomUUID(),
                user_id: DEFAULT_USER_ID,
                node_id: nodeId,
                value,
                completed_at: dateStr,
                created_at: new Date().toISOString(),
              });
              completionDelta = 1;
            }
          }

          // Calculate node stability
          const node = state.nodes.find((n) => n.id === nodeId);
          if (!node) return {};

          const nodeImpulses = updatedImpulses.filter((i) => i.node_id === nodeId);
          const newStability = recalculateNodeStability(node, nodeImpulses);

          const updatedNodes = state.nodes.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  stability_score: newStability,
                  completion_count: Math.max(0, n.completion_count + completionDelta),
                  updated_at: new Date().toISOString(),
                }
              : n
          );

          // Calculate all cores stability
          const updatedCores = state.cores.map((c) => {
            const newCoreStability = recalculateCoreStability(
              c.id,
              updatedNodes,
              state.coreConnectors,
              state.nodeConnectors
            );
            return {
              ...c,
              stability_score: newCoreStability,
              updated_at: new Date().toISOString(),
            };
          });

          return {
            impulses: updatedImpulses,
            nodes: updatedNodes,
            cores: updatedCores,
          };
        });

        return true;
      },

      cancelImpulse: (nodeId, dateStr) => {
        return get().recordImpulse(nodeId, 0, dateStr, false);
      },

      getImpulsesForNodeAndDate: (nodeId, dateStr) => {
        return get().impulses.filter((i) => i.node_id === nodeId && i.completed_at === dateStr);
      },

      updateImpulseComment: (nodeId, dateStr, comment) => {
        let updated = false;
        set((state) => {
          const existingIndex = state.impulses.findIndex(
            (i) => i.node_id === nodeId && i.completed_at === dateStr
          );

          let updatedImpulses = [...state.impulses];

          if (existingIndex > -1) {
            const impulse = updatedImpulses[existingIndex];
            if (comment.trim() === "" && impulse.value === 0) {
              // Remove 0-value impulse if comment is cleared
              updatedImpulses.splice(existingIndex, 1);
            } else {
              updatedImpulses[existingIndex] = {
                ...impulse,
                comment: comment,
                created_at: new Date().toISOString(),
              };
            }
            updated = true;
          } else if (comment.trim() !== "") {
            // Create a 0-value impulse to store the comment
            updatedImpulses.push({
              id: crypto.randomUUID(),
              user_id: DEFAULT_USER_ID,
              node_id: nodeId,
              value: 0,
              completed_at: dateStr,
              comment: comment,
              created_at: new Date().toISOString(),
            });
            updated = true;
          }

          return {
            impulses: updatedImpulses,
          };
        });
        return updated;
      },

      updateWikiPage: (title, content) => {
        set((state) => {
          const updatedPages = { ...(state.wikiPages || {}) };
          if (content.trim() === "") {
            delete updatedPages[title];
          } else {
            updatedPages[title] = content;
          }
          return { wikiPages: updatedPages };
        });
      },

      deleteWikiPage: (title) => {
        set((state) => {
          const updatedPages = { ...(state.wikiPages || {}) };
          delete updatedPages[title];
          return { wikiPages: updatedPages };
        });
      },

      getDailyFocusNodeIds: (dateStr) => {
        return get()
          .dailyFocus.filter((df) => df.focus_date === dateStr)
          .map((df) => df.node_id);
      },

      setDailyFocusNodes: (nodeIds, dateStr) => {
        const now = new Date().toISOString();
        const newFocus = nodeIds.map((nodeId) => ({
          id: crypto.randomUUID(),
          user_id: DEFAULT_USER_ID,
          node_id: nodeId,
          focus_date: dateStr,
          created_at: now,
        }));

        set((state) => ({
          dailyFocus: [
            ...state.dailyFocus.filter((df) => df.focus_date !== dateStr),
            ...newFocus,
          ],
        }));

        return true;
      },

      exportData: () => {
        const { profile, nodes, cores, connectors, coreConnectors, nodeConnectors, impulses, dailyFocus } = get();
        return JSON.stringify(
          {
            version: "2.0-offline",
            profile,
            nodes,
            cores,
            connectors,
            coreConnectors,
            nodeConnectors,
            impulses,
            dailyFocus,
          },
          null,
          2
        );
      },

      importData: (jsonString) => {
        try {
          const parsed = JSON.parse(jsonString);
          // Simple validation
          if (parsed && Array.isArray(parsed.nodes) && Array.isArray(parsed.cores)) {
            set({
              profile: parsed.profile || createDefaultProfile(),
              nodes: parsed.nodes,
              cores: parsed.cores,
              connectors: parsed.connectors || [],
              coreConnectors: parsed.coreConnectors || [],
              nodeConnectors: parsed.nodeConnectors || [],
              impulses: parsed.impulses || [],
              dailyFocus: parsed.dailyFocus || [],
            });
            return true;
          }
          return false;
        } catch (e) {
          console.error("Failed to import database", e);
          return false;
        }
      },

      clearDatabase: () => {
        set({
          profile: createDefaultProfile(),
          nodes: [],
          cores: [],
          connectors: [],
          coreConnectors: [],
          nodeConnectors: [],
          impulses: [],
          dailyFocus: [],
        });
      },

      recalculateAllDecay: () => {
        set((state) => {
          const updatedNodes = state.nodes.map((node) => {
            const nodeImpulses = state.impulses.filter((i) => i.node_id === node.id);
            const newStability = recalculateNodeStability(node, nodeImpulses);
            return {
              ...node,
              stability_score: newStability,
              updated_at: new Date().toISOString(),
            };
          });

          const updatedCores = state.cores.map((c) => {
            const newCoreStability = recalculateCoreStability(
              c.id,
              updatedNodes,
              state.coreConnectors,
              state.nodeConnectors
            );
            return {
              ...c,
              stability_score: newCoreStability,
              updated_at: new Date().toISOString(),
            };
          });

          return {
            nodes: updatedNodes,
            cores: updatedCores,
          };
        });
      },
    }),
    {
      name: "nodes-offline-database",
      storage: createJSONStorage(() => indexedDBStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated(true);
          state.checkAndApplyDailyDecay();
        }
      },
    }
  )
);
