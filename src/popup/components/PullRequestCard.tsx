import { useState } from "react";
import { ExternalLink, GitMerge } from "lucide-react";
import type { GitHubPullRequest } from "../../lib/github/client";
import { useMergePullRequest } from "../hooks/usePullRequests";

interface PullRequestCardProps {
  pullRequest: GitHubPullRequest;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 30) {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMin > 0) return `${diffMin}m ago`;
  return "just now";
}

export function PullRequestCard({ pullRequest }: PullRequestCardProps) {
  const [confirmingMerge, setConfirmingMerge] = useState(false);
  const [mergeError, setMergeError] = useState<string | null>(null);

  const mergeMutation = useMergePullRequest();

  function handleOpen() {
    chrome.tabs.create({ url: pullRequest.html_url });
  }

  function handleMergeClick() {
    setMergeError(null);
    setConfirmingMerge(true);
  }

  function handleCancel() {
    setConfirmingMerge(false);
    setMergeError(null);
  }

  async function handleConfirmMerge() {
    try {
      setMergeError(null);

      const owner = pullRequest.repository?.owner;
      const repo = pullRequest.repository?.name;

      if (!owner || !repo) {
        throw new Error("Repository owner or name is missing.");
      }

      await mergeMutation.mutateAsync({
        owner,
        repo,
        pullNumber: pullRequest.number,
        mergeMethod: "squash",
      });

      setConfirmingMerge(false);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to merge pull request.";
      setMergeError(message);
    }
  }

  const canMerge = pullRequest.state === "open" && !pullRequest.draft;

  return (
    <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3
            className="truncate text-xs font-semibold text-white"
            title={pullRequest.title}
          >
            {pullRequest.title}
          </h3>

          <p className="mt-0.5 truncate text-[11px] text-zinc-400">
            {pullRequest.repository?.full_name || "Unknown repository"}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {pullRequest.draft && (
            <span className="rounded-full border border-zinc-700 bg-zinc-800/60 px-1.5 py-0.5 text-[10px] text-zinc-400">
              Draft
            </span>
          )}

          <span
            className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium capitalize ${
              pullRequest.merged_at
                ? "border-purple-800/70 bg-purple-950/40 text-purple-400"
                : pullRequest.state === "open"
                ? "border-emerald-800/70 bg-emerald-950/40 text-emerald-400"
                : "border-zinc-700 bg-zinc-800/60 text-zinc-400"
            }`}
          >
            {pullRequest.merged_at ? "Merged" : pullRequest.state}
          </span>
        </div>
      </div>

      {/* Meta info */}
      <div className="flex items-center gap-2 text-[11px] text-zinc-500">
        <span>#{pullRequest.number}</span>
        <span>•</span>
        <span>
          {formatRelativeTime(
            pullRequest.updated_at || pullRequest.created_at
          )}
        </span>
        {typeof pullRequest.comments === "number" && pullRequest.comments > 0 ? (
          <>
            <span>•</span>
            <span>{pullRequest.comments} comments</span>
          </>
        ) : null}
      </div>

      {/* Error state */}
      {mergeError && (
        <div className="rounded border border-red-900/50 bg-red-950/30 p-2 text-[11px] text-red-300">
          <p className="font-medium">Unable to merge pull request.</p>
          <p className="mt-0.5 text-[10px] text-red-400/90">{mergeError}</p>
        </div>
      )}

      {/* Actions */}
      <div className="pt-1">
        {confirmingMerge ? (
          <div className="flex items-center justify-between gap-2 rounded-md border border-zinc-800 bg-zinc-950/80 p-2">
            <span className="text-[11px] text-zinc-300">Are you sure?</span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCancel}
                disabled={mergeMutation.isPending}
                className="rounded border border-zinc-800 px-2 py-0.5 text-[11px] text-zinc-400 transition hover:bg-zinc-800 hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmMerge}
                disabled={mergeMutation.isPending}
                className="rounded bg-emerald-600 px-2 py-0.5 text-[11px] font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
              >
                {mergeMutation.isPending ? "Merging..." : "Merge"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpen}
              className="flex flex-1 items-center justify-center gap-1 rounded-md border border-zinc-800 px-2.5 py-1 text-xs text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
            >
              <ExternalLink size={12} />
              Open
            </button>

            {canMerge && (
              <button
                type="button"
                onClick={handleMergeClick}
                className="flex flex-1 items-center justify-center gap-1 rounded-md border border-emerald-900/60 bg-emerald-950/40 px-2.5 py-1 text-xs font-medium text-emerald-400 transition hover:bg-emerald-900/50 hover:text-emerald-300"
              >
                <GitMerge size={12} />
                Merge
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
