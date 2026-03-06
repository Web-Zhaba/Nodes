import { useMemo } from "react";
import { useNodesQuery } from "@/features/nodes/hooks/useNodesQuery";
import {
  useCoresQuery,
  useCoreConnectorsQuery,
} from "@/features/core-management/hooks/useCoresQuery";
import { useConnectorsQuery } from "@/features/connectors/hooks/useConnectorsQuery";
import { buildGraphData } from "@/entities/graph/model/buildGraphData";
import type { GraphData } from "@/entities/graph/model/types";

interface UseGraphDataResult {
  graphData: GraphData;
  isLoading: boolean;
}

/**
 * Composes React Query data sources and builds graph-ready data.
 *
 * Memoized: only recomputes when the underlying normalized data changes.
 * Each of the four queries is already cached by React Query (5min staleTime),
 * so this hook adds zero extra network requests.
 */
export function useGraphData(userId: string | undefined): UseGraphDataResult {
  const { data: nodes = {}, isLoading: isNodesLoading } =
    useNodesQuery(userId);
  const { data: cores = {}, isLoading: isCoresLoading } =
    useCoresQuery(userId);
  const { data: connectors = {}, isLoading: isConnectorsLoading } =
    useConnectorsQuery(userId);
  const { data: coreConnectors = {}, isLoading: isCoreConnectorsLoading } =
    useCoreConnectorsQuery(userId);

  const isLoading =
    isNodesLoading ||
    isCoresLoading ||
    isConnectorsLoading ||
    isCoreConnectorsLoading;

  const graphData = useMemo(
    () => buildGraphData(nodes, cores, connectors, coreConnectors),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nodes, cores, connectors, coreConnectors]
  );

  return { graphData, isLoading };
}
