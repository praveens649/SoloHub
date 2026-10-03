import { useQuery } from "@tanstack/react-query";
import { getAuth, setAuth } from "../../lib/storage/auth";
import { getGitHubUser, getRepositories } from "../../lib/github/client";
import { getWeeklyProductivity } from "../../lib/github/productivity";

export function useWeeklyProductivity() {
  return useQuery({
    queryKey: ["productivity", "weekly"],

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

      const repositories = await getRepositories(
        auth.token
      );

      return getWeeklyProductivity(
        auth.token,
        repositories,
        user.login
      );
    },

    staleTime: 5 * 60 * 1000,
  });
}