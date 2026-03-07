import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getDailyFocusNodeIds, 
  setDailyFocusNodes 
} from "../nodeService";
import { format } from "date-fns";

export const focusKeys = {
  all: ["dailyFocus"] as const,
  date: (date: Date) => [...focusKeys.all, format(date, "yyyy-MM-dd")] as const,
};

export function useDailyFocusQuery(date: Date, userId: string | undefined) {
  return useQuery({
    queryKey: focusKeys.date(date),
    queryFn: () => getDailyFocusNodeIds(date, userId),
    enabled: !!userId,
  });
}

export function useSetDailyFocusMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ nodeIds, date, userId }: { nodeIds: string[]; date: Date; userId: string | undefined }) =>
      setDailyFocusNodes(nodeIds, date, userId),
    onSuccess: (_, { date }) => {
      queryClient.invalidateQueries({ queryKey: focusKeys.date(date) });
    },
  });
}
