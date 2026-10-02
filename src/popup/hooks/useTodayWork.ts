import { useQuery } from "@tanstack/react-query";
import { getAuth } from "../../lib/storage/auth";
import { getTodayWork } from "../../lib/github/work";

export function useTodayWork() {
  return useQuery({
    queryKey: ["productivity", "work", "today"],

    queryFn: async () => {
      const auth = await getAuth();

      if (!auth?.token || !auth.user) {
        throw new Error("Not authenticated");
      }

      return getTodayWork(
        auth.token,
        auth.user.login
      );
    },

    staleTime: 5 * 60 * 1000,
  });
}