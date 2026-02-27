import { create } from "zustand";
import type { Node, Core, Connector, NodeType } from "@/types";

// Тип для сегодняшних значений узлов
interface TodayNodeValues {
  [nodeId: string]: {
    isCompleted: boolean;
    value: number; // Для quantity/duration
  };
}

interface NodesState {
  // Nodes
  nodes: Node[];
  isLoading: boolean;
  error: string | null;

  // Cores
  cores: Core[];

  // Connectors
  connectors: Connector[];

  // Сегодняшние значения узлов
  todayValues: TodayNodeValues;

  // Actions: Nodes
  setNodes: (nodes: Node[]) => void;
  addNode: (node: Node) => void;
  updateNode: (id: string, updates: Partial<Node>) => void;
  removeNode: (id: string) => void;
  updateNodeStability: (id: string, stability: number) => void;

  // Actions: Today values
  setTodayValues: (nodeId: string, isCompleted: boolean, value: number) => void;
  setBatchTodayValues: (values: TodayNodeValues) => void;
  updateTodayQuantity: (nodeId: string, value: number) => void;

  // Actions: Cores
  setCores: (cores: Core[]) => void;
  addCore: (core: Core) => void;
  updateCore: (id: string, updates: Partial<Core>) => void;
  removeCore: (id: string) => void;

  // Actions: Connectors
  setConnectors: (connectors: Connector[]) => void;
  addConnector: (connector: Connector) => void;
  updateConnector: (id: string, updates: Partial<Connector>) => void;
  removeConnector: (id: string) => void;
}

export const useNodesStore = create<NodesState>()((set) => ({
  // Initial state
  nodes: [],
  cores: [],
  connectors: [],
  todayValues: {},
  isLoading: false,
  error: null,

  // Nodes actions
  setNodes: (nodes: Node[]) => set({ nodes }),

  addNode: (node: Node) =>
    set((state) => ({
      nodes: [...state.nodes, node],
    })),

  updateNode: (id: string, updates: Partial<Node>) =>
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    })),

  removeNode: (id: string) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
    })),

  updateNodeStability: (id: string, stability: number) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, stability_score: stability } : n,
      ),
    })),

  // Today values actions
  setTodayValues: (nodeId: string, isCompleted: boolean, value: number) =>
    set((state) => ({
      todayValues: {
        ...state.todayValues,
        [nodeId]: { isCompleted, value },
      },
    })),

  setBatchTodayValues: (values: TodayNodeValues) =>
    set((state) => ({
      todayValues: {
        ...state.todayValues,
        ...values,
      },
    })),

  updateTodayQuantity: (nodeId: string, value: number) =>
    set((state) => ({
      todayValues: {
        ...state.todayValues,
        [nodeId]: {
          ...state.todayValues[nodeId],
          value,
        },
      },
    })),

  // Cores actions
  setCores: (cores: Core[]) => set({ cores }),

  addCore: (core: Core) =>
    set((state) => ({
      cores: [...state.cores, core],
    })),

  updateCore: (id: string, updates: Partial<Core>) =>
    set((state) => ({
      cores: state.cores.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),

  removeCore: (id: string) =>
    set((state) => ({
      cores: state.cores.filter((c) => c.id !== id),
    })),

  // Connectors actions
  setConnectors: (connectors: Connector[]) => set({ connectors }),

  addConnector: (connector: Connector) =>
    set((state) => ({
      connectors: [...state.connectors, connector],
    })),

  updateConnector: (id: string, updates: Partial<Connector>) =>
    set((state) => ({
      connectors: state.connectors.map((c) =>
        c.id === id ? { ...c, ...updates } : c,
      ),
    })),

  removeConnector: (id: string) =>
    set((state) => ({
      connectors: state.connectors.filter((c) => c.id !== id),
    })),
}));

/**
 * Helper: Создание узла по умолчанию
 */
export function createDefaultNode(
  userId: string,
  name: string,
  nodeType: NodeType = "binary",
): Omit<Node, "id" | "created_at" | "updated_at"> {
  return {
    user_id: userId,
    name,
    description: "",
    node_type: nodeType,
    mass: 1.0,
    stability_score: 0,
    completion_count: 0,
    category: "default",
    frequency: "daily",
    color: "#6366f1",
    icon: "circle",
    position_x: undefined,
    position_y: undefined,
    core_id: undefined,
    target_value: nodeType === "binary" ? undefined : 10,
  };
}

/**
 * Helper: Создание ядра по умолчанию
 */
export function createDefaultCore(
  userId: string,
  name: string,
): Omit<Core, "id" | "created_at" | "updated_at"> {
  return {
    user_id: userId,
    name,
    description: "",
    color: "#6366f1",
    icon: "circle",
    stability_score: 0,
    position_x: undefined,
    position_y: undefined,
  };
}
