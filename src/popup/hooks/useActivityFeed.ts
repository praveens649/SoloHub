import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAuth } from "../../lib/storage/auth";
import {
  getUserActivity,
  getUserReceivedEvents,
  getUserNotifications,
  type GitHubEvent,
  type GitHubNotification,
} from "../../lib/github/client";
import {
  formatGitHubEvents,
  type ActivityItem,
} from "../../lib/github/activity";

export type FeedSource = "following" | "personal";

export function useActivityFeed(initialSource: FeedSource = "following") {
  const queryClient = useQueryClient();
  const [feedSource, setFeedSource] = useState<FeedSource>(initialSource);

  const query = useQuery<ActivityItem[]>({
    queryKey: ["activity", "feed", feedSource],
    queryFn: async () => {
      const auth = await getAuth();

      if (!auth?.token || !auth.user?.login) {
        throw new Error("Not authenticated");
      }

      let events: GitHubEvent[];
      let isFollowing = false;

      if (feedSource === "following") {
        try {
          events = await getUserReceivedEvents(auth.token, auth.user.login);
          isFollowing = true;
        } catch {
          events = [];
        }

        // If following events are empty, fall back to user's activity
        if (events.length === 0) {
          try {
            events = await getUserActivity(auth.token, auth.user.login);
            isFollowing = false;
          } catch {
            events = [];
          }
        }
      } else {
        events = await getUserActivity(auth.token, auth.user.login);
        isFollowing = false;
      }

      // Optionally fetch notifications
      let notifications: GitHubNotification[];
      try {
        notifications = await getUserNotifications(auth.token);
      } catch {
        notifications = [];
      }

      return formatGitHubEvents(events, notifications, isFollowing);
    },
    staleTime: 3 * 60 * 1000,
  });

  const refresh = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["activity", "feed"],
    });
  };

  return {
    ...query,
    feedSource,
    setFeedSource,
    refresh,
  };
}
