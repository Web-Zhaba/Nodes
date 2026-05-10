import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { publicService } from "../api/public.service";
import { supabase } from "@/lib/supabase";
import { buildGraphData } from "@/entities/graph/model/buildGraphData";
import type { NormalizedData, Node, Core, Connector, CoreConnector } from "@/types";

/**
 * Хук для получения данных публичного узла и его импульсов
 */
export function usePublicNodeData(token: string | undefined) {
  const nodeQuery = useQuery({
    queryKey: ["public-node", token],
    queryFn: () => publicService.getNodeByToken(token!),
    enabled: !!token,
    retry: false,
  });

  const impulsesQuery = useQuery({
    queryKey: ["public-impulses", nodeQuery.data?.id],
    queryFn: () => publicService.getPublicImpulses(nodeQuery.data!.id),
    enabled: !!nodeQuery.data?.id,
  });

  const profileQuery = useQuery({
    queryKey: ["public-profile-by-id", nodeQuery.data?.user_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", nodeQuery.data!.user_id)
        .single();
      return data;
    },
    enabled: !!nodeQuery.data?.user_id,
  });

  return {
    node: nodeQuery.data,
    impulses: impulsesQuery.data || [],
    profile: profileQuery.data,
    isLoading: nodeQuery.isLoading || impulsesQuery.isLoading || profileQuery.isLoading,
    error: nodeQuery.error
  };
}

/**
 * Хук для получения данных публичного профиля и всей его сети (графа)
 */
export function usePublicProfileData(slug: string | undefined) {
  const profileQuery = useQuery({
    queryKey: ["public-profile", slug],
    queryFn: () => publicService.getProfileBySlug(slug!),
    enabled: !!slug,
  });

  const userId = profileQuery.data?.id;

  const graphQueries = useQuery({
    queryKey: ["public-graph-data", userId],
    queryFn: async () => {
      const [nodes, cores, connectors] = await Promise.all([
        publicService.getPublicNodes(userId!),
        publicService.getPublicCores(userId!),
        publicService.getPublicConnectors(userId!)
      ]);
      
      const coreIds = cores.map(c => c.id);
      const coreConnectors = await publicService.getPublicCoreConnectors(coreIds);

      return { nodes, cores, connectors, coreConnectors };
    },
    enabled: !!userId,
  });

  const graphData = useMemo(() => {
    if (!graphQueries.data || !userId) return { nodes: [], links: [] };

    const { nodes: rawNodes, cores: rawCores, connectors: rawConnectors, coreConnectors: rawCoreConnectors } = graphQueries.data;

    const nodes: NormalizedData<Node> = rawNodes.reduce((acc, n) => {
      const connector_ids = (n as any).node_connectors?.map((nc: any) => nc.connector_id) ?? [];
      acc[n.id] = { ...n, connector_ids } as any;
      return acc;
    }, {} as NormalizedData<Node>);

    const cores: NormalizedData<Core> = rawCores.reduce((acc, c) => {
      acc[c.id] = c as any;
      return acc;
    }, {} as NormalizedData<Core>);

    const connectors: NormalizedData<Connector> = rawConnectors.reduce((acc, c) => {
      acc[c.id] = c as any;
      return acc;
    }, {} as NormalizedData<Connector>);

    const coreConnectors: NormalizedData<CoreConnector> = rawCoreConnectors.reduce((acc, cc) => {
      acc[cc.id] = cc as any;
      return acc;
    }, {} as NormalizedData<CoreConnector>);

    return buildGraphData(nodes, cores, connectors, coreConnectors);
  }, [userId, graphQueries.data]);

  return {
    profile: profileQuery.data,
    graph: graphQueries.data,
    graphData,
    isLoading: profileQuery.isLoading || graphQueries.isLoading,
    error: profileQuery.error
  };
}
