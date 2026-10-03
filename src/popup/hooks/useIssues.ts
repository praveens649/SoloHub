import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAuth, setAuth } from "../../lib/storage/auth";
import {
  getGitHubUser,
  getUserIssues,
  updateIssueState,
  createIssue,
  type GitHubIssue,
} from "../../lib/github/client";

export function useIssues(state: "open" | "closed" = "open") {
  return useQuery<GitHubIssue[]>({
    queryKey: ["issues", state],
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

      return getUserIssues(auth.token, user.login, state);
    },
    staleTime: 5 * 60 * 1000,
  });
}

interface UpdateIssueStateParams {
  owner: string;
  repo: string;
  issueNumber: number;
  state: "open" | "closed";
}

export function useUpdateIssueState() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      owner,
      repo,
      issueNumber,
      state,
    }: UpdateIssueStateParams) => {
      const auth = await getAuth();

      if (!auth?.token) {
        throw new Error("Not authenticated");
      }

      return updateIssueState(auth.token, owner, repo, issueNumber, state);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      queryClient.invalidateQueries({ queryKey: ["productivity"] });
    },
  });
}

interface CreateIssueParams {
  owner: string;
  repo: string;
  title: string;
  body?: string;
}

export function useCreateIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ owner, repo, title, body }: CreateIssueParams) => {
      const auth = await getAuth();

      if (!auth?.token) {
        throw new Error("Not authenticated");
      }

      return createIssue(auth.token, owner, repo, title, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      queryClient.invalidateQueries({ queryKey: ["productivity"] });
    },
  });
}
