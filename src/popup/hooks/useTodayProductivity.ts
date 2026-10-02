import { useQuery } from "@tanstack/react-query";
import { getAuth } from "../../lib/storage/auth";
import { getRepositories } from "../../lib/github/client";
import { getTodayProductivity } from "../../lib/github/productivity";

export function useTodayProductivity() {
  return useQuery({
    queryKey: ["productivity", "today"],

    queryFn: async () => {
      const auth = await getAuth();

      if (!auth?.token || !auth.user) {
        throw new Error("Not authenticated");
      }

      const repositories = await getRepositories(
        auth.token
      );
     
      return getTodayProductivity(
        auth.token,
        auth.user,
        repositories
      );
    },
    staleTime: 5 * 60 * 1000,
  });
}