import { useState } from "react";
import { Plus } from "lucide-react";
import { useIssues } from "../hooks/useIssues";
import { IssueCard } from "./IssueCard";
import { NewIssueForm } from "./NewIssueForm";
import { GitHubRateLimitMessage } from "./GitHubRateLimitMessage";
import { CardSkeleton } from "./feedback/Skeletons";

export function IssueSection() {
  const [filter, setFilter] = useState<"open" | "closed">("open");
  const [showNewForm, setShowNewForm] = useState(false);

  const {
    data: issues,
    isLoading,
    isError,
    error,
    refetch,
  } = useIssues(filter);

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-500">Tasks & Tracking</p>
          <h2 className="text-lg font-semibold text-white">Issues</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* New Issue button */}
          {!showNewForm && (
            <button
              type="button"
              onClick={() => setShowNewForm(true)}
              className="flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900/80 px-2 py-1 text-xs text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
            >
              <Plus size={12} />
              New Issue
            </button>
          )}

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
      </div>

      {/* New Issue Form */}
      {showNewForm && (
        <div className="mb-3">
          <NewIssueForm onClose={() => setShowNewForm(false)} />
        </div>
      )}

      {/* Status states */}
      {isLoading && !issues && (
        <CardSkeleton count={3} />
      )}

      {isError && !issues && (
        <GitHubRateLimitMessage error={error} onRetry={() => refetch()} />
      )}

      {issues && (
        <div className="space-y-2">
          {issues.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-800 p-6 text-center">
              <p className="text-xs text-zinc-500">
                {filter === "open"
                  ? "No open issues."
                  : "No closed issues."}
              </p>
            </div>
          ) : (
            issues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))
          )}
        </div>
      )}
    </section>
  );
}
