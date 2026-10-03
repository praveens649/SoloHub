import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAuth, setAuth } from "../../lib/storage/auth";
import { getGitHubUser, getRepositories } from "../../lib/github/client";
import { getWeeklyProductivity } from "../../lib/github/productivity";

export function useTodayProductivity() {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["productivity", "today"],

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

      const weekly = await queryClient.ensureQueryData({
        queryKey: ["productivity", "weekly"],
        queryFn: async () => {
          const repositories = await queryClient.ensureQueryData({
            queryKey: ["repositories", { starred: false }],
            queryFn: () => getRepositories(auth.token),
            staleTime: 5 * 60 * 1000,
          });

          return getWeeklyProductivity(
            auth.token,
            repositories,
            user.login
          );
        },
        staleTime: 5 * 60 * 1000,
      });

      return weekly.today;
    },
    staleTime: 5 * 60 * 1000,
  });
}