import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getUserNodes, 
  createNode,
  updateNode,
  deleteNode,
  getNodeById
} from "../nodeService";
import type { Node, NormalizedData } from "@/types";

export const nodesKeys = {
  all: ["nodes"] as const,
  detail: (id: string) => [...nodesKeys.all, id] as const,
};

export function useNodesQuery(userId: string | undefined) {
  return useQuery<NormalizedData<Node>>({
    queryKey: nodesKeys.all,
    queryFn: async () => {
      const data = await getUserNodes(userId);
      return data.reduce((acc, node) => ({ ...acc, [node.id]: node }), {} as NormalizedData<Node>);
    },
    enabled: !!userId,
  });
}

export function useNodeQuery(nodeId: string | undefined) {
  return useQuery({
    queryKey: nodesKeys.detail(nodeId || ""),
    queryFn: () => getNodeById(nodeId!),
    enabled: !!nodeId,
  });
}

export function useCreateNodeMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (args: { node: any; userId?: string }) => createNode(args.node, args.userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nodesKeys.all });
    },
  });
}

export function useUpdateNodeMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (args: { nodeId: string; updates: any; userId?: string }) => 
      updateNode(args.nodeId, args.updates, args.userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: nodesKeys.all });
      queryClient.invalidateQueries({ queryKey: nodesKeys.detail(variables.nodeId) });
    },
  });
}

export function useDeleteNodeMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (nodeId: string) => deleteNode(nodeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nodesKeys.all });
    },
  });
}
