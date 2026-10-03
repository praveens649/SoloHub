import { useState } from "react";
import { CircleDot, CheckCircle2, ExternalLink } from "lucide-react";
import type { GitHubIssue } from "../../lib/github/client";
import { useUpdateIssueState } from "../hooks/useIssues";

interface IssueCardProps {
  issue: GitHubIssue;
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

export function IssueCard({ issue }: IssueCardProps) {
  const [confirmingClose, setConfirmingClose] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const updateMutation = useUpdateIssueState();

  function handleOpen() {
    chrome.tabs.create({ url: issue.html_url });
  }

  function handleCloseClick() {
    setActionError(null);
    setConfirmingClose(true);
  }

  function handleCancelClose() {
    setConfirmingClose(false);
    setActionError(null);
  }

  async function handleConfirmClose() {
    try {
      setActionError(null);

      const owner = issue.repository?.owner;
      const repo = issue.repository?.name;

      if (!owner || !repo) {
        throw new Error("Repository owner or name is missing.");
      }

      await updateMutation.mutateAsync({
        owner,
        repo,
        issueNumber: issue.number,
        state: "closed",
      });

      setConfirmingClose(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to close issue.";
      setActionError(message);
    }
  }

  async function handleReopen() {
    try {
      setActionError(null);

      const owner = issue.repository?.owner;
      const repo = issue.repository?.name;

      if (!owner || !repo) {
        throw new Error("Repository owner or name is missing.");
      }

      await updateMutation.mutateAsync({
        owner,
        repo,
        issueNumber: issue.number,
        state: "open",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to reopen issue.";
      setActionError(message);
    }
  }

  const isOpen = issue.state === "open";

  return (
    <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3
            className="truncate text-xs font-semibold text-white"
            title={issue.title}
          >
            {issue.title}
          </h3>

          <p className="mt-0.5 truncate text-[11px] text-zinc-400">
            {issue.repository?.full_name || "Unknown repository"}
          </p>
        </div>

        <span
          className={`flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium capitalize ${
            isOpen
              ? "border-emerald-800/70 bg-emerald-950/40 text-emerald-400"
              : "border-purple-800/70 bg-purple-950/40 text-purple-400"
          }`}
        >
          {isOpen ? (
            <CircleDot size={10} className="text-emerald-400" />
          ) : (
            <CheckCircle2 size={10} className="text-purple-400" />
          )}
          {issue.state}
        </span>
      </div>

      {/* Meta info & Labels */}
      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-500">
        <span>#{issue.number}</span>
        <span>•</span>
        <span>
          {formatRelativeTime(issue.updated_at || issue.created_at)}
        </span>

        {typeof issue.comments === "number" && issue.comments > 0 ? (
          <>
            <span>•</span>
            <span>{issue.comments} comments</span>
          </>
        ) : null}

        {issue.labels && issue.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {issue.labels.slice(0, 3).map((label) => (
              <span
                key={label.id}
                className="rounded px-1.5 py-0.2 text-[9px] font-medium text-zinc-300"
                style={{
                  backgroundColor: `#${label.color}25`,
                  border: `1px solid #${label.color}50`,
                }}
              >
                {label.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Error state */}
      {actionError && (
        <div className="rounded border border-red-900/50 bg-red-950/30 p-2 text-[11px] text-red-300">
          <p className="font-medium">
            {isOpen ? "Unable to close issue." : "Unable to reopen issue."}
          </p>
          <p className="mt-0.5 text-[10px] text-red-400/90">{actionError}</p>
        </div>
      )}

      {/* Actions */}
      <div className="pt-1">
        {confirmingClose ? (
          <div className="flex items-center justify-between gap-2 rounded-md border border-zinc-800 bg-zinc-950/80 p-2">
            <span className="text-[11px] text-zinc-300">
              Close this issue?
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCancelClose}
                disabled={updateMutation.isPending}
                className="rounded border border-zinc-800 px-2 py-0.5 text-[11px] text-zinc-400 transition hover:bg-zinc-800 hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmClose}
                disabled={updateMutation.isPending}
                className="rounded bg-red-600/90 px-2 py-0.5 text-[11px] font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
              >
                {updateMutation.isPending ? "Closing..." : "Close"}
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

            {isOpen ? (
              <button
                type="button"
                onClick={handleCloseClick}
                className="flex flex-1 items-center justify-center gap-1 rounded-md border border-zinc-800 px-2.5 py-1 text-xs text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
              >
                <CircleDot size={12} />
                Close
              </button>
            ) : (
              <button
                type="button"
                onClick={handleReopen}
                disabled={updateMutation.isPending}
                className="flex flex-1 items-center justify-center gap-1 rounded-md border border-emerald-900/60 bg-emerald-950/40 px-2.5 py-1 text-xs font-medium text-emerald-400 transition hover:bg-emerald-900/50 hover:text-emerald-300 disabled:opacity-50"
              >
                <CircleDot size={12} />
                {updateMutation.isPending ? "Reopening..." : "Reopen"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
