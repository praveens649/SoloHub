import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAuth, setAuth } from "../../lib/storage/auth";
import {
  getGitHubUser,
  getUserPullRequests,
  mergePullRequest,
  type GitHubPullRequest,
} from "../../lib/github/client";

export function usePullRequests(state: "open" | "closed" = "open") {
  return useQuery<GitHubPullRequest[]>({
    queryKey: ["pullRequests", { state }],
    queryFn: async () => {
      const auth = await getAuth();

      if (!auth?.token) {
        throw new Error("Not authenticated");
      }

      let user = auth.user;
      if (!user) {
        user = await getGitHubUser(auth.token);
        await setAuth(auth.token, user);
      }

      return getUserPullRequests(auth.token, user.login, state);
    },
    staleTime: 5 * 60 * 1000,
  });
}

interface MergePullRequestParams {
  owner: string;
  repo: string;
  pullNumber: number;
  mergeMethod?: "squash" | "merge" | "rebase";
}

export function useMergePullRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      owner,
      repo,
      pullNumber,
      mergeMethod = "squash",
    }: MergePullRequestParams) => {
      const auth = await getAuth();

      if (!auth?.token) {
        throw new Error("Not authenticated");
      }

      return mergePullRequest(
        auth.token,
        owner,
        repo,
        pullNumber,
        mergeMethod
      );
    },
    onSuccess: () => {
      // Invalidate PR queries so UI refreshes immediately
      queryClient.invalidateQueries({ queryKey: ["pullRequests"] });
      // Invalidate productivity queries to update PRs merged metrics
      queryClient.invalidateQueries({ queryKey: ["productivity"] });
    },
  });
}
