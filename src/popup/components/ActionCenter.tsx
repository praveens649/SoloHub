import { useMemo, useState } from "react";
import {
  CircleDot,
  ExternalLink,
  GitMerge,
  GitPullRequest,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { usePullRequests, useMergePullRequest } from "../hooks/usePullRequests";
import { useIssues, useUpdateIssueState } from "../hooks/useIssues";
import { ErrorState } from "./feedback/ErrorState";
import { CardSkeleton } from "./feedback/Skeletons";
import { ConfirmDialog } from "./feedback/ConfirmDialog";
import { useToast } from "./feedback/ToastContext";
import { formatGitHubError } from "../../lib/github/errors";
import type { GitHubIssue, GitHubPullRequest } from "../../lib/github/client";

export type ActionItem =
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

export type ActionFilter = "all" | "prs" | "issues";

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

interface ActionCenterProps {
  previewLimit?: number;
  onViewAll?: () => void;
  showHeader?: boolean;
}

export function ActionCenter({
  previewLimit,
  onViewAll,
  showHeader = true,
}: ActionCenterProps) {
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
    let result = items;
    if (filter === "prs") {
      result = items.filter((item) => item.type === "pull_request");
    } else if (filter === "issues") {
      result = items.filter((item) => item.type === "issue");
    }

    if (previewLimit && previewLimit > 0) {
      return result.slice(0, previewLimit);
    }
    return result;
  }, [items, filter, previewLimit]);

  return (
    <section className="space-y-2.5">
      {/* Header if requested */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#FAFAFA]">
              Action Center
            </h2>
            <p className="text-[11px] text-[#71717A]">
              {isLoading
                ? "Checking for actions..."
                : isError
                ? "Unable to load actions"
                : `${items.length} item${items.length === 1 ? "" : "s"} need attention`}
            </p>
          </div>

          {/* Filter buttons */}
          <div className="flex gap-0.5 rounded-lg border border-[#27272A] bg-[#0F0F11] p-0.5">
            {(["all", "prs", "issues"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFilter(option)}
                className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                  filter === option
                    ? "bg-[#FAFAFA] text-[#090A0F]"
                    : "text-[#71717A] hover:text-[#FAFAFA]"
                }`}
              >
                {option === "all" ? "ALL" : option === "prs" ? "PRS" : "ISSUES"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading state with CardSkeleton */}
      {isLoading && !hasData && <CardSkeleton count={previewLimit || 2} />}

      {/* Error state */}
      {!isLoading && isError && !hasData && (
        <ErrorState
          error={prsErrorObj || issuesErrorObj}
          onRetry={() => {
            refetchPrs();
            refetchIssues();
          }}
          fallbackMessage="Unable to load action items."
        />
      )}

      {/* Empty state */}
      {!isLoading && !isError && filteredItems.length === 0 && (
        <div className="rounded-lg border border-dashed border-[#27272A] bg-[#0F0F11]/50 p-6 text-center">
          <p className="text-xs text-[#71717A]">No actions needed.</p>
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

      {/* View all button in preview mode */}
      {previewLimit && items.length > previewLimit && onViewAll && (
        <button
          type="button"
          onClick={onViewAll}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#27272A] bg-[#0F0F11] py-2 text-xs font-medium text-[#A1A1AA] transition-colors hover:bg-[#18181B] hover:text-[#FAFAFA] cursor-pointer"
        >
          <span>View all ({items.length})</span>
          <ArrowRight size={13} />
        </button>
      )}
    </section>
  );
}

function ActionCenterItem({ item }: { item: ActionItem }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const toast = useToast();

  const mergeMutation = useMergePullRequest();
  const updateIssueMutation = useUpdateIssueState();

  const isPR = item.type === "pull_request";
  const pr = isPR ? item.data : null;
  const issue = !isPR ? item.data : null;

  const title = isPR ? pr!.title : issue!.title;
  const htmlUrl = isPR ? pr!.html_url : issue!.html_url;
  const number = isPR ? pr!.number : issue!.number;
  const repoName = isPR
    ? pr!.repository?.full_name || "repository"
    : issue!.repository?.full_name || "repository";
  const isDraft = isPR && Boolean(pr!.draft);
  const canMerge = isPR && !isDraft;

  function handleOpen() {
    if (typeof chrome !== "undefined" && chrome.tabs?.create) {
      chrome.tabs.create({ url: htmlUrl });
    } else {
      window.open(htmlUrl, "_blank");
    }
  }

  async function handleConfirmAction() {
    try {
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

        toast.success("✓ Pull request merged");
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

        toast.success("✓ Issue closed");
      }

      setConfirmOpen(false);
    } catch (err) {
      const fallback = isPR ? "Unable to merge pull request." : "Unable to close issue.";
      const msg = formatGitHubError(err, fallback);
      toast.error(msg);
    }
  }

  const isPending = isPR
    ? mergeMutation.isPending
    : updateIssueMutation.isPending;

  return (
    <>
      <div className="space-y-2 rounded-lg border border-[#27272A] bg-[#0F0F11] p-3 transition-colors hover:border-[#3F3F46]">
        {/* Top row: Type badge, Repo & Number, Relative time */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {isPR ? (
                <span className="inline-flex items-center gap-1 rounded bg-blue-950/60 px-1.5 py-0.5 text-[10px] font-semibold text-blue-400 border border-blue-900/60">
                  <GitPullRequest size={10} />
                  PR
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded bg-amber-950/60 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-900/60">
                  <CircleDot size={10} />
                  Issue
                </span>
              )}

              {isDraft && (
                <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 border border-zinc-700">
                  Draft
                </span>
              )}

              <span className="truncate text-[11px] text-[#71717A]">
                {repoName} • #{number}
              </span>
            </div>

            <h3
              className="mt-1 text-xs font-semibold text-[#FAFAFA] leading-snug line-clamp-2"
              title={title}
            >
              {title}
            </h3>
          </div>

          <span className="shrink-0 text-[10px] text-[#71717A]">
            {formatRelativeTime(item.updatedAt)}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-0.5">
          <button
            type="button"
            onClick={handleOpen}
            className="flex h-7 items-center justify-center gap-1 rounded-md border border-[#27272A] bg-[#090A0F] px-2.5 text-[11px] font-medium text-[#A1A1AA] transition-colors hover:bg-[#18181B] hover:text-[#FAFAFA] cursor-pointer"
          >
            <span>Open</span>
            <ExternalLink size={11} />
          </button>

          {/* Merge button for PR (only when not draft) */}
          {canMerge && (
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={isPending}
              className="flex h-7 items-center justify-center gap-1 rounded-md border border-emerald-900/60 bg-emerald-950/30 px-2.5 text-[11px] font-medium text-emerald-400 transition-colors hover:bg-emerald-900/50 hover:text-emerald-200 disabled:opacity-50 cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 size={11} className="animate-spin" />
                  <span>Merging...</span>
                </>
              ) : (
                <>
                  <GitMerge size={11} />
                  <span>Merge</span>
                </>
              )}
            </button>
          )}

          {/* Close button for Issue */}
          {!isPR && (
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={isPending}
              className="flex h-7 items-center justify-center gap-1 rounded-md border border-[#27272A] bg-[#090A0F] px-2.5 text-[11px] font-medium text-[#A1A1AA] transition-colors hover:bg-red-950/30 hover:border-red-900/50 hover:text-red-300 disabled:opacity-50 cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 size={11} className="animate-spin" />
                  <span>Closing...</span>
                </>
              ) : (
                <span>Close</span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        title={isPR ? "Merge pull request?" : "Close issue?"}
        description={
          <div>
            <p className="font-medium text-[#FAFAFA]">#{number} {title}</p>
            <p className="mt-1 text-[11px] text-[#71717A]">
              {isPR
                ? `Will be squash merged into ${repoName}.`
                : `Will be marked as closed in ${repoName}.`}
            </p>
          </div>
        }
        confirmLabel={
          isPending
            ? isPR
              ? "Merging..."
              : "Closing..."
            : isPR
            ? "Merge"
            : "Close Issue"
        }
        loading={isPending}
        variant={isPR ? "default" : "danger"}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
