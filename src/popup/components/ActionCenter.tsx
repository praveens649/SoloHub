import { useMemo, useState } from "react";
import {
  CircleDot,
  ExternalLink,
  GitMerge,
  GitPullRequest,
} from "lucide-react";
import { usePullRequests, useMergePullRequest } from "../hooks/usePullRequests";
import { useIssues, useUpdateIssueState } from "../hooks/useIssues";
import { GitHubRateLimitMessage } from "./GitHubRateLimitMessage";
import type { GitHubIssue, GitHubPullRequest } from "../../lib/github/client";

type ActionItem =
  | {
      id: string;
      type: "pull_request";
      data: GitHubPullRequest;
      updatedAt: string;
    }
  | {
      id: string;
      type: "issue";
      data: GitHubIssue;
      updatedAt: string;
    };

type ActionFilter = "all" | "prs" | "issues";

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

export function ActionCenter() {
  const [filter, setFilter] = useState<ActionFilter>("all");

  const {
    data: pullRequests,
    isLoading: prsLoading,
    isError: prsError,
    error: prsErrorObj,
    refetch: refetchPrs,
  } = usePullRequests("open");

  const {
    data: issues,
    isLoading: issuesLoading,
    isError: issuesError,
    error: issuesErrorObj,
    refetch: refetchIssues,
  } = useIssues("open");

  const hasData = Boolean(pullRequests || issues);
  const isLoading = (prsLoading && !pullRequests) || (issuesLoading && !issues);
  const isError = (prsError && !pullRequests) || (issuesError && !issues);

  const items: ActionItem[] = useMemo(() => {
    const prItems: ActionItem[] = (pullRequests || [])
      .filter((pr) => pr.state === "open" && !pr.merged_at)
      .map((pr) => ({
        id: `pr-${pr.id}`,
        type: "pull_request" as const,
        data: pr,
        updatedAt: pr.updated_at || pr.created_at,
      }));

    const issueItems: ActionItem[] = (issues || [])
      .filter((issue) => issue.state === "open")
      .map((issue) => ({
        id: `issue-${issue.id}`,
        type: "issue" as const,
        data: issue,
        updatedAt: issue.updated_at || issue.created_at,
      }));

    const combined = [...prItems, ...issueItems];
    combined.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    return combined;
  }, [pullRequests, issues]);

  const filteredItems = useMemo(() => {
    if (filter === "prs") {
      return items.filter((item) => item.type === "pull_request");
    }
    if (filter === "issues") {
      return items.filter((item) => item.type === "issue");
    }
    return items;
  }, [items, filter]);

  return (
    <section>
      {/* Section Header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Action Center</h2>
          <p className="text-xs text-zinc-500">
            {isLoading
              ? "Checking for actions..."
              : isError
              ? "Unable to load actions"
              : `${filteredItems.length} item${
                  filteredItems.length === 1 ? "" : "s"
                } need attention`}
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex gap-1 rounded-md border border-zinc-800 bg-zinc-900/80 p-0.5">
          {(["all", "prs", "issues"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={`rounded px-2.5 py-1 text-xs uppercase transition ${
                filter === option
                  ? "bg-white font-medium text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {option === "all"
                ? "All"
                : option === "prs"
                ? "PRs"
                : "Issues"}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && !hasData && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500">Loading actions...</p>
        </div>
      )}

      {/* Error state */}
      {!isLoading && isError && !hasData && (
        <GitHubRateLimitMessage
          error={prsErrorObj || issuesErrorObj}
          onRetry={() => {
            refetchPrs();
            refetchIssues();
          }}
        />
      )}

      {/* Empty state */}
      {!isLoading && !isError && filteredItems.length === 0 && (
        <div className="rounded-lg border border-dashed border-zinc-800 p-6 text-center">
          <p className="text-xs text-zinc-500">No actions needed.</p>
        </div>
      )}

      {/* Action Item Cards */}
      {filteredItems.length > 0 && (
        <div className="space-y-2">
          {filteredItems.map((item) => (
            <ActionCenterItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

function ActionCenterItem({ item }: { item: ActionItem }) {
  const [confirming, setConfirming] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const mergeMutation = useMergePullRequest();
  const updateIssueMutation = useUpdateIssueState();

  const isPR = item.type === "pull_request";
  const pr = isPR ? item.data : null;
  const issue = !isPR ? item.data : null;

  const title = isPR ? pr!.title : issue!.title;
  const htmlUrl = isPR ? pr!.html_url : issue!.html_url;
  const number = isPR ? pr!.number : issue!.number;
  const repoName = isPR
    ? pr!.repository?.full_name || "Unknown repository"
    : issue!.repository?.full_name || "Unknown repository";
  const isDraft = isPR && Boolean(pr!.draft);
  const canMerge = isPR && !isDraft;

  function handleOpen() {
    chrome.tabs.create({ url: htmlUrl });
  }

  function handleActionClick() {
    setActionError(null);
    setConfirming(true);
  }

  function handleCancel() {
    setConfirming(false);
    setActionError(null);
  }

  async function handleConfirm() {
    try {
      setActionError(null);

      if (isPR && pr) {
        const owner = pr.repository?.owner;
        const repo = pr.repository?.name;

        if (!owner || !repo) {
          throw new Error("Missing repository information.");
        }

        await mergeMutation.mutateAsync({
          owner,
          repo,
          pullNumber: pr.number,
          mergeMethod: "squash",
        });
      } else if (!isPR && issue) {
        const owner = issue.repository?.owner;
        const repo = issue.repository?.name;

        if (!owner || !repo) {
          throw new Error("Missing repository information.");
        }

        await updateIssueMutation.mutateAsync({
          owner,
          repo,
          issueNumber: issue.number,
          state: "closed",
        });
      }

      setConfirming(false);
    } catch (err) {
      const defaultMsg = isPR
        ? "Unable to merge pull request."
        : "Unable to close issue.";
      const message = err instanceof Error ? err.message : defaultMsg;
      setActionError(message);
    }
  }

  const isPending = isPR
    ? mergeMutation.isPending
    : updateIssueMutation.isPending;

  return (
    <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            {isPR ? (
              <span className="flex items-center gap-1 rounded bg-blue-950/70 px-1.5 py-0.5 text-[10px] font-medium text-blue-400 border border-blue-800/60">
                <GitPullRequest size={10} />
                PR
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded bg-amber-950/70 px-1.5 py-0.5 text-[10px] font-medium text-amber-400 border border-amber-800/60">
                <CircleDot size={10} />
                Issue
              </span>
            )}

            {isDraft && (
              <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 border border-zinc-700">
                Draft
              </span>
            )}
          </div>

          <h3
            className="mt-1 truncate text-xs font-semibold text-white"
            title={title}
          >
            {title}
          </h3>

          <p className="mt-0.5 truncate text-[11px] text-zinc-400">
            {repoName} • #{number}
          </p>
        </div>

        <span className="shrink-0 text-[10px] text-zinc-500">
          {formatRelativeTime(item.updatedAt)}
        </span>
      </div>

      {/* Error Message */}
      {actionError && (
        <div className="rounded border border-red-900/50 bg-red-950/30 p-2 text-[11px] text-red-300">
          <p className="font-medium">
            {isPR ? "Unable to merge pull request." : "Unable to close issue."}
          </p>
          <p className="mt-0.5 text-[10px] text-red-400/90">{actionError}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-1">
        {confirming ? (
          <div className="flex items-center justify-between gap-2 rounded-md border border-zinc-800 bg-zinc-950/80 p-2">
            <span className="text-[11px] text-zinc-300">
              {isPR ? "Merge this PR?" : "Close this issue?"}
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isPending}
                className="rounded border border-zinc-800 px-2 py-0.5 text-[11px] text-zinc-400 transition hover:bg-zinc-800 hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                className={`rounded px-2 py-0.5 text-[11px] font-medium text-white transition disabled:opacity-50 ${
                  isPR
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : "bg-red-600/90 hover:bg-red-500"
                }`}
              >
                {isPending
                  ? isPR
                    ? "Merging..."
                    : "Closing..."
                  : isPR
                  ? "Merge"
                  : "Close"}
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

            {isPR && canMerge && (
              <button
                type="button"
                onClick={handleActionClick}
                className="flex flex-1 items-center justify-center gap-1 rounded-md border border-emerald-900/60 bg-emerald-950/40 px-2.5 py-1 text-xs font-medium text-emerald-400 transition hover:bg-emerald-900/50 hover:text-emerald-300"
              >
                <GitMerge size={12} />
                Merge
              </button>
            )}

            {!isPR && (
              <button
                type="button"
                onClick={handleActionClick}
                className="flex flex-1 items-center justify-center gap-1 rounded-md border border-zinc-800 px-2.5 py-1 text-xs text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
              >
                <CircleDot size={12} />
                Close
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
