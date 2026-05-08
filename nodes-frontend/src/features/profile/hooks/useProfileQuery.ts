import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileService } from "../profile.service";
import type { Profile } from "@/types";

export function useProfileQuery(userId?: string) {
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: () => (userId ? profileService.getProfile(userId) : null),
    enabled: !!userId,
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, updates }: { userId: string; updates: Partial<Profile> }) =>
      profileService.updateProfile(userId, updates),
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData(["profile", data.id], data);
      }
    },
  });
}
