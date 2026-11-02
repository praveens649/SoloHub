import { useQuery } from "@tanstack/react-query";
import { getAuth, setAuth } from "../../lib/storage/auth";
import {
  getGitHubUser,
  getUserYearlyContributions,
} from "../../lib/github/client";

export function useYearlyContributions() {
  return useQuery({
    queryKey: ["contributions", "yearly"],
    queryFn: async () => {
      const auth = await getAuth();
      if (!auth?.token) {
        return null;
      }

      let user = auth.user;
      if (!user?.login) {
        try {
          user = await getGitHubUser(auth.token);
          await setAuth(auth.token, user);
        } catch {
          // Continue if user fetch fails
        }
      }

      return getUserYearlyContributions(auth.token, user?.login);
    },
    staleTime: 10 * 60 * 1000,
  });
}
