import { useState } from "react";
import { usePullRequests } from "../hooks/usePullRequests";
import { PullRequestCard } from "../components/PullRequestCard";
import { GitHubRateLimitMessage } from "../components/GitHubRateLimitMessage";

export function PullRequestsPage() {
  const [filter, setFilter] = useState<"open" | "closed">("open");
  const {
    data: pullRequests,
    isLoading,
    isError,
    error,
    refetch,
  } = usePullRequests(filter);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] text-[#71717A]">Reviews & Merges</p>
          <h1 className="text-base font-bold text-[#FAFAFA]">Pull Requests</h1>
        </div>

        {/* Filters */}
        <div className="flex gap-0.5 rounded-lg border border-[#27272A] bg-[#0F0F11] p-0.5">
          {(["open", "closed"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={`rounded-md px-2.5 py-1 text-xs capitalize transition-colors cursor-pointer ${
                filter === option
                  ? "bg-[#FAFAFA] font-medium text-[#090A0F]"
                  : "text-[#71717A] hover:text-[#FAFAFA]"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && !pullRequests && (
        <div className="rounded-lg border border-[#27272A] bg-[#0F0F11] p-4 text-center">
          <p className="text-xs text-[#71717A]">Loading pull requests...</p>
        </div>
      )}

      {/* Rate limit / Error state */}
      {isError && !pullRequests && (
        <GitHubRateLimitMessage error={error} onRetry={() => refetch()} />
      )}

      {/* Pull Request list */}
      {pullRequests && (
        <div className="space-y-2">
          {pullRequests.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#27272A] bg-[#0F0F11]/50 p-6 text-center">
              <p className="text-xs text-[#71717A]">
                {filter === "open"
                  ? "No open pull requests."
                  : "No closed pull requests."}
              </p>
            </div>
          ) : (
            pullRequests.map((pr) => (
              <PullRequestCard key={pr.id} pullRequest={pr} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
