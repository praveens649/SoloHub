import { useState } from "react";
import { usePullRequests } from "../hooks/usePullRequests";
import { PullRequestCard } from "./PullRequestCard";

export function PullRequestSection() {
  const [filter, setFilter] = useState<"open" | "closed">("open");
  const { data: pullRequests, isLoading, isError } = usePullRequests(filter);

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-500">Reviews & Merges</p>
          <h2 className="text-lg font-semibold text-white">Pull Requests</h2>
        </div>

        {/* Filter buttons */}
        <div className="flex gap-1 rounded-md border border-zinc-800 bg-zinc-900/80 p-0.5">
          {(["open", "closed"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={`rounded px-2.5 py-1 text-xs capitalize transition ${
                filter === option
                  ? "bg-white font-medium text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500">Loading pull requests...</p>
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-red-400">Failed to load pull requests.</p>
        </div>
      )}

      {!isLoading && !isError && pullRequests && (
        <div className="space-y-2">
          {pullRequests.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-800 p-6 text-center">
              <p className="text-xs text-zinc-500">
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
    </section>
  );
}
