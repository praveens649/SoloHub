import {
  GitCommit,
  GitPullRequest,
  CircleDot,
  FolderGit2,
} from "lucide-react";
import { useTodayWork } from "../hooks/useTodayWork";
import { useTodayProductivity } from "../hooks/useTodayProductivity";

export function TodayProductivity() {
  const {
    data,
    isLoading,
    isError,
  } = useTodayWork();
  const {
    data: productivity,
    isLoading: productivityLoading,
    isError: productivityError,
  } = useTodayProductivity();

  if (isLoading || productivityLoading) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <p className="text-xs text-zinc-500">
          Calculating today's activity...
        </p>
      </div>
    );
  }

  if (isError || productivityError || !data || !productivity) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <p className="text-xs text-red-400">
          Failed to load today's activity.
        </p>
      </div>
    );
  }

  const commits = typeof productivity?.commits === "number" ? productivity.commits : 0;
  const pullRequests = typeof data?.pullRequests === "number" ? data.pullRequests : 0;
  const issues = typeof data?.issues === "number" ? data.issues : 0;
  const activeRepositories =
    typeof data?.activeRepositories === "number" ? data.activeRepositories : 0;

  return (
    <div>
      <div className="mb-3">
        <p className="text-xs text-zinc-500">
          Productivity
        </p>

        <h2 className="text-lg font-semibold text-white">
          Today
        </h2>
      </div>

      <div className="grid grid-cols-2 items-stretch gap-2">
        <div className="min-h-[82px] rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">
              Commits
            </span>

            <GitCommit
              size={14}
              className="text-zinc-600"
            />
          </div>

          <p className="mt-2 text-xl font-semibold text-white">
            {commits}
          </p>
        </div>

        <div className="min-h-[82px] rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">
              Pull Requests
            </span>

            <GitPullRequest
              size={14}
              className="text-zinc-600"
            />
          </div>

          <p className="mt-2 text-xl font-semibold text-white">
            {pullRequests}
          </p>
        </div>

        <div className="min-h-[82px] rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">
              Issues
            </span>

            <CircleDot
              size={14}
              className="text-zinc-600"
            />
          </div>

          <p className="mt-2 text-xl font-semibold text-white">
            {issues}
          </p>
        </div>
        <div className="min-h-[82px] rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">
              Active Repositories
            </span>

            <FolderGit2
              size={14}
              className="text-zinc-600"
            />
          </div>

          <p className="mt-2 text-xl font-semibold text-white">
            {activeRepositories}
          </p>
        </div>
      </div>
    </div>
  );
}