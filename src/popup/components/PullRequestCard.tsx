import { useState } from "react";
import { ExternalLink, GitMerge, Loader2 } from "lucide-react";
import type { GitHubPullRequest } from "../../lib/github/client";
import { useMergePullRequest } from "../hooks/usePullRequests";
import { useToast } from "./feedback/ToastContext";
import { ConfirmDialog } from "./feedback/ConfirmDialog";
import { formatGitHubError } from "../../lib/github/errors";

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
  const mergeMutation = useMergePullRequest();
  const toast = useToast();

  function handleOpen() {
    if (typeof chrome !== "undefined" && chrome.tabs?.create) {
      chrome.tabs.create({ url: pullRequest.html_url });
    } else {
      window.open(pullRequest.html_url, "_blank");
    }
  }

  async function handleConfirmMerge() {
    try {
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
      toast.success("✓ Pull request merged");
    } catch (err) {
      const message = formatGitHubError(err, "Unable to merge pull request.");
      toast.error(message);
    }
  }

  const canMerge = pullRequest.state === "open" && !pullRequest.draft;

  return (
    <>
      <div className="space-y-2 rounded-lg border border-[#27272A] bg-[#0F0F11] p-3 transition-colors hover:border-[#3F3F46]">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3
              className="truncate text-xs font-semibold text-[#FAFAFA]"
              title={pullRequest.title}
            >
              {pullRequest.title}
            </h3>

            <p className="mt-0.5 truncate text-[11px] text-[#71717A]">
              {pullRequest.repository?.full_name || "repository"}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {pullRequest.draft && (
              <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 border border-zinc-700">
                Draft
              </span>
            )}

            <span
              className={`rounded border px-1.5 py-0.5 text-[10px] font-medium capitalize ${
                pullRequest.merged_at
                  ? "border-purple-800/70 bg-purple-950/40 text-purple-400"
                  : pullRequest.state === "open"
                  ? "border-emerald-800/70 bg-emerald-950/40 text-emerald-400"
                  : "border-[#3F3F46] bg-[#18181B] text-[#A1A1AA]"
              }`}
            >
              {pullRequest.merged_at ? "Merged" : pullRequest.state}
            </span>
          </div>
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-2 text-[11px] text-[#71717A]">
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

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleOpen}
            className="flex flex-1 h-7 items-center justify-center gap-1 rounded-md border border-[#27272A] bg-[#090A0F] px-2.5 text-xs text-[#A1A1AA] transition-colors hover:bg-[#18181B] hover:text-[#FAFAFA] cursor-pointer"
          >
            <ExternalLink size={12} />
            <span>Open</span>
          </button>

          {canMerge && (
            <button
              type="button"
              onClick={() => setConfirmingMerge(true)}
              disabled={mergeMutation.isPending}
              className="flex flex-1 h-7 items-center justify-center gap-1 rounded-md border border-emerald-900/60 bg-emerald-950/40 px-2.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-900/60 hover:text-emerald-200 disabled:opacity-50 cursor-pointer"
            >
              {mergeMutation.isPending ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  <span>Merging...</span>
                </>
              ) : (
                <>
                  <GitMerge size={12} />
                  <span>Merge</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmingMerge}
        title="Merge pull request?"
        description={
          <div>
            <p className="font-medium text-[#FAFAFA]">#{pullRequest.number} {pullRequest.title}</p>
            <p className="mt-1 text-[11px] text-[#71717A]">
              Will be squash merged into {pullRequest.repository?.name || "main"}.
            </p>
          </div>
        }
        confirmLabel={mergeMutation.isPending ? "Merging..." : "Merge"}
        loading={mergeMutation.isPending}
        variant="default"
        onConfirm={handleConfirmMerge}
        onCancel={() => setConfirmingMerge(false)}
      />
    </>
  );
}
