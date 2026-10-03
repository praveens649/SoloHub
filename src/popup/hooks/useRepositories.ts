import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAuth } from "../../lib/storage/auth";
import {
  createRepository,
  getRepositories,
  type CreateRepositoryParams,
} from "../../lib/github/client";

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