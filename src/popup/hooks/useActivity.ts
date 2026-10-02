import { useQuery } from "@tanstack/react-query";
import { getAuth } from "../../lib/storage/auth";
import { getUserActivity } from "../../lib/github/client";

export function useActivity() {
  return useQuery({
    queryKey: ["activity"],
    queryFn: async () => {
      const auth = await getAuth();

      if (!auth?.token || !auth.user?.login) {
        throw new Error("Not authenticated");
      }

      return getUserActivity(
        auth.token,
        auth.user.login
      );
    },
    staleTime: 5 * 60 * 1000,
  });
}