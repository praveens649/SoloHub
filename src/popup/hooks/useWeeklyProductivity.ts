import { useQuery } from "@tanstack/react-query";
import { getAuth } from "../../lib/storage/auth";
import { getRepositories } from "../../lib/github/client";
import { getWeeklyProductivity } from "../../lib/github/productivity";

export function useWeeklyProductivity() {
  return useQuery({
    queryKey: ["productivity", "weekly"],

    queryFn: async () => {
      const auth = await getAuth();

      if (!auth?.token || !auth.user) {
        throw new Error("Not authenticated");
      }

      const repositories = await getRepositories(
        auth.token
      );

      return getWeeklyProductivity(
        auth.token,
        auth.user,
        repositories
      );
    },

    staleTime: 5 * 60 * 1000,
  });
}