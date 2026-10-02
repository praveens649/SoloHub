import { useQuery } from "@tanstack/react-query";
import { getAuth } from "../../lib/storage/auth";
import { getRepositories } from "../../lib/github/client";

export function useRepositories(starred = false) {
  return useQuery({
    queryKey: ["repositories", { starred }],

    queryFn: async () => {
      const auth = await getAuth();

      if (!auth?.token) {
        throw new Error("Not authenticated");
      }

      return getRepositories(auth.token, starred);
    },

    staleTime: 5 * 60 * 1000,
  });
}