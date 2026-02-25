import { create } from 'zustand'
import type { Node } from '@/types'

interface NodesState {
  nodes: Node[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setNodes: (nodes: Node[]) => void;
  addNode: (node: Node) => void;
  updateNode: (id: string, updates: Partial<Node>) => void;
  removeNode: (id: string) => void;
}

export const useNodesStore = create<NodesState>((set) => ({
  nodes: [],
  isLoading: false,
  error: null,

  setNodes: (nodes) => set({ nodes }),
  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
  updateNode: (id, updates) => set((state) => ({
    nodes: state.nodes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
  })),
  removeNode: (id) => set((state) => ({
    nodes: state.nodes.filter((n) => n.id !== id),
  })),
}))
