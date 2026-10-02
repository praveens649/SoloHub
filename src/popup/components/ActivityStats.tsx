import {
  GitCommit,
  GitPullRequest,
  CircleDot,
  FolderGit2,
} from "lucide-react";
import type { GitHubEvent } from "../../lib/github/client";
import { calculateActivityStats } from "../../lib/github/activity";

interface ActivityStatsProps {
  events: GitHubEvent[];
}

export function ActivityStats({
  events,
}: ActivityStatsProps) {
  const stats = calculateActivityStats(events);

  const cards = [
    {
      label: "Commits",
      value: stats.commits,
      icon: GitCommit,
    },
    {
      label: "Pull Requests",
      value: stats.pullRequests,
      icon: GitPullRequest,
    },
    {
      label: "Issues",
      value: stats.issues,
      icon: CircleDot,
    },
    {
      label: "Repositories",
      value: stats.repositories,
      icon: FolderGit2,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.label}
            className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">
                {card.label}
              </span>

              <Icon
                size={14}
                className="text-zinc-600"
              />
            </div>

            <p className="mt-2 text-xl font-semibold text-white">
              {card.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}