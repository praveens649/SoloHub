import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAuth } from "../../lib/storage/auth";
import {
  createRepository,
  getRepositories,
  type CreateRepositoryParams,
} from "../../lib/github/client";

export interface UseRepositoriesOptions {
  starred?: boolean;
  org?: string;
  includeOrgs?: boolean;
}

export function useRepositories(
  starredOrOptions: boolean | UseRepositoriesOptions = false
) {
  const options: UseRepositoriesOptions =
    typeof starredOrOptions === "boolean"
      ? { starred: starredOrOptions }
      : starredOrOptions;

  const { starred = false, org, includeOrgs = true } = options;

  return useQuery({
    queryKey: ["repositories", { starred, org, includeOrgs }],

    queryFn: async () => {
      const auth = await getAuth();

      if (!auth?.token) {
        throw new Error("Not authenticated");
      }

      return getRepositories(auth.token, starred, 2, { org, includeOrgs });
    },

    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateRepository() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateRepositoryParams) => {
      const auth = await getAuth();

      if (!auth?.token) {
        throw new Error("Not authenticated");
      }

      return createRepository(auth.token, params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repositories"] });
    },
  });
}