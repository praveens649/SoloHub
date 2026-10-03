import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAuth } from "../../lib/storage/auth";
import {
  addRepositoryCollaborator,
  getRepositoryCollaborators,
  removeRepositoryCollaborator,
} from "../../lib/github/client";
import type { CollaboratorPermission } from "../../lib/github/types";

export function useCollaborators(owner?: string, repo?: string) {
  return useQuery({
    queryKey: ["collaborators", owner, repo],
    queryFn: async () => {
      const auth = await getAuth();

      if (!auth?.token) {
        throw new Error("Not authenticated");
      }

      if (!owner || !repo) {
        return [];
      }

      return getRepositoryCollaborators(auth.token, owner, repo);
    },
    enabled: Boolean(owner && repo),
    staleTime: 2 * 60 * 1000,
  });
}

export interface AddCollaboratorVariables {
  owner: string;
  repo: string;
  username: string;
  permission?: CollaboratorPermission;
}

export function useAddCollaborator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      owner,
      repo,
      username,
      permission = "push",
    }: AddCollaboratorVariables) => {
      const auth = await getAuth();

      if (!auth?.token) {
        throw new Error("Not authenticated");
      }

      return addRepositoryCollaborator(
        auth.token,
        owner,
        repo,
        username,
        permission
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["collaborators", variables.owner, variables.repo],
      });
    },
  });
}

export interface RemoveCollaboratorVariables {
  owner: string;
  repo: string;
  username: string;
}

export function useRemoveCollaborator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      owner,
      repo,
      username,
    }: RemoveCollaboratorVariables) => {
      const auth = await getAuth();

      if (!auth?.token) {
        throw new Error("Not authenticated");
      }

      return removeRepositoryCollaborator(auth.token, owner, repo, username);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["collaborators", variables.owner, variables.repo],
      });
    },
  });
}
