import { useQuery } from "@tanstack/react-query";
import { getAuth, setAuth } from "../../lib/storage/auth";
import { getGitHubUser } from "../../lib/github/client";
import { getTodayWork } from "../../lib/github/work";

export function useTodayWork() {
  return useQuery({
    queryKey: ["productivity", "work", "today"],

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

      return getTodayWork(
        auth.token,
        user.login
      );
    },

    staleTime: 5 * 60 * 1000,
  });
}