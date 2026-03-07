import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getUserCores, 
  createCore, 
  updateCore, 
  deleteCore, 
  getUserCoreConnectors, 
  toggleCoreConnector 
} from "../coreService";
import type { Core, CoreConnector, NormalizedData } from "@/types";

export const coresKeys = {
  all: ["cores"] as const,
  connectors: ["coreConnectors"] as const,
};

export function useCoresQuery(userId: string | undefined) {
  return useQuery<NormalizedData<Core>>({
    queryKey: coresKeys.all,
    queryFn: async () => {
      const data = await getUserCores(userId);
      return data.reduce((acc, core) => ({ ...acc, [core.id]: core }), {} as NormalizedData<Core>);
    },
    enabled: !!userId,
  });
}

export function useCreateCoreMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, name, color, icon }: { userId: string; name: string; color: string; icon?: string }) =>
      createCore(userId, name, color, icon),
    onSuccess: (newCore) => {
      if (!newCore) return;
      queryClient.setQueryData<NormalizedData<Core>>(coresKeys.all, (old) => {
        return old ? { ...old, [newCore.id]: newCore } : { [newCore.id]: newCore };
      });
    },
  });
}

export function useUpdateCoreMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ coreId, updates }: { coreId: string; updates: Partial<Pick<Core, "name" | "color" | "icon">> }) =>
      updateCore(coreId, updates),
    onMutate: async ({ coreId, updates }) => {
      await queryClient.cancelQueries({ queryKey: coresKeys.all });
      const previousCores = queryClient.getQueryData<NormalizedData<Core>>(coresKeys.all);
      
      if (previousCores && previousCores[coreId]) {
        queryClient.setQueryData<NormalizedData<Core>>(coresKeys.all, {
          ...previousCores,
          [coreId]: { ...previousCores[coreId], ...updates },
        });
      }
      return { previousCores };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousCores) {
        queryClient.setQueryData(coresKeys.all, context.previousCores);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: coresKeys.all });
    },
  });
}

export function useDeleteCoreMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (coreId: string) => deleteCore(coreId),
    onMutate: async (coreId) => {
      await queryClient.cancelQueries({ queryKey: coresKeys.all });
      const previousCores = queryClient.getQueryData<NormalizedData<Core>>(coresKeys.all);
      
      if (previousCores) {
        const { [coreId]: removed, ...rest } = previousCores;
        queryClient.setQueryData<NormalizedData<Core>>(coresKeys.all, rest);
      }
      return { previousCores };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousCores) {
        queryClient.setQueryData(coresKeys.all, context.previousCores);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: coresKeys.all });
    },
  });
}

export function useCoreConnectorsQuery(userId: string | undefined) {
  return useQuery<NormalizedData<CoreConnector>>({
    queryKey: coresKeys.connectors,
    queryFn: async () => {
      const data = await getUserCoreConnectors();
      return data.reduce((acc, cc) => ({ ...acc, [cc.id]: cc }), {} as NormalizedData<CoreConnector>);
    },
    enabled: !!userId,
  });
}

export function useToggleCoreConnectorMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ coreId, connectorId, isLinked }: { coreId: string; connectorId: string; isLinked: boolean }) =>
      toggleCoreConnector(coreId, connectorId, isLinked),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coresKeys.connectors });
    },
  });
}
