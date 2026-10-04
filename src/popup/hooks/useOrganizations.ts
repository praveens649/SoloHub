import { useQuery } from "@tanstack/react-query";
import { getAuth } from "../../lib/storage/auth";
import { getUserOrganizations } from "../../lib/github/client";
import type { GitHubOrganization } from "../../lib/github/types";

export function useOrganizations() {
  return useQuery<GitHubOrganization[]>({
    queryKey: ["organizations"],
    queryFn: async () => {
      const auth = await getAuth();

      if (!auth?.token) {
        throw new Error("Not authenticated");
      }

      return getUserOrganizations(auth.token);
    },
    staleTime: 10 * 60 * 1000,
  });
}
