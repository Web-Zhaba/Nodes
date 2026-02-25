import { create } from "zustand";
import type { Node } from "@/types";

interface NodesState {
  nodes: Node[];
  isLoading: boolean;
  error: string | null;
  setNodes: (nodes: Node[]) => void;
  addNode: (node: Node) => void;
  updateNode: (id: string, updates: Partial<Node>) => void;
  removeNode: (id: string) => void;
}

export const useNodesStore = create<NodesState>()((set) => ({
  nodes: [],
  isLoading: false,
  error: null,
  setNodes: (nodes: Node[]) => set({ nodes }),
  addNode: (node: Node) => set((state) => ({ nodes: [...state.nodes, node] })),
  updateNode: (id: string, updates: Partial<Node>) =>
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    })),
  removeNode: (id: string) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
    })),
}));
