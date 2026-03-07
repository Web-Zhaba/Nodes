import { useQuery } from "@tanstack/react-query";
import { getUserConnectors } from "../connectorService";
import type { Connector, NormalizedData } from "@/types";

export const connectorsKeys = {
  all: ["connectors"] as const,
};

export function useConnectorsQuery(userId: string | undefined) {
  return useQuery<NormalizedData<Connector>>({
    queryKey: connectorsKeys.all,
    queryFn: async () => {
      const data = await getUserConnectors(userId);
      return data.reduce((acc, connector) => ({ ...acc, [connector.id]: connector }), {} as NormalizedData<Connector>);
    },
    enabled: !!userId,
  });
}
