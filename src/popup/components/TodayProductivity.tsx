import {
  GitCommit,
  GitPullRequest,
  CircleDot,
  FolderGit2,
  GitMerge,
  CheckCircle2,
} from "lucide-react";
import { useTodayWork } from "../hooks/useTodayWork";
import { useTodayProductivity } from "../hooks/useTodayProductivity";
import { GitHubRateLimitMessage } from "./GitHubRateLimitMessage";

export function TodayProductivity() {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useTodayWork();
  const {
    data: productivity,
    isLoading: productivityLoading,
    isError: productivityError,
    error: productivityErrorObj,
    refetch: refetchProductivity,
  } = useTodayProductivity();

  if ((isLoading && !data) || (productivityLoading && !productivity)) {
    return (
      <div className="rounded-lg border border-[#27272A] bg-[#0F0F11] p-3.5">
        <p className="text-xs text-[#71717A]">Calculating today's activity...</p>
      </div>
    );
  }

  if ((isError || productivityError) && (!data || !productivity)) {
    return (
      <GitHubRateLimitMessage
        error={productivityErrorObj || error}
        onRetry={() => {
          refetch();
          refetchProductivity();
        }}
      />
    );
  }

  const commits = typeof productivity?.commits === "number" ? productivity.commits : 0;
  const pullRequests = typeof data?.pullRequests === "number" ? data.pullRequests : 0;
  const issues = typeof data?.issues === "number" ? data.issues : 0;
  const activeRepositories =
    typeof data?.activeRepositories === "number" ? data.activeRepositories : 0;
  const mergedPRs = typeof data?.mergedPullRequests === "number" ? data.mergedPullRequests : 0;
  const closedIssues = typeof data?.closedIssues === "number" ? data.closedIssues : 0;

  return (
    <section className="space-y-2">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#71717A]">
          Today
        </p>
      </div>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Commits */}
        <div className="rounded-lg border border-[#27272A] bg-[#0F0F11] p-2.5 transition-colors hover:border-[#3F3F46]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#A1A1AA]">Commits</span>
            <GitCommit size={13} className="text-[#71717A]" />
          </div>
          <p className="mt-1 text-lg font-bold text-[#FAFAFA] font-mono">
            {commits}
          </p>
        </div>

        {/* PRs */}
        <div className="rounded-lg border border-[#27272A] bg-[#0F0F11] p-2.5 transition-colors hover:border-[#3F3F46]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#A1A1AA]">PRs</span>
            <GitPullRequest size={13} className="text-[#71717A]" />
          </div>
          <p className="mt-1 text-lg font-bold text-[#FAFAFA] font-mono">
            {pullRequests}
          </p>
        </div>

        {/* Issues */}
        <div className="rounded-lg border border-[#27272A] bg-[#0F0F11] p-2.5 transition-colors hover:border-[#3F3F46]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#A1A1AA]">Issues</span>
            <CircleDot size={13} className="text-[#71717A]" />
          </div>
          <p className="mt-1 text-lg font-bold text-[#FAFAFA] font-mono">
            {issues}
          </p>
        </div>

        {/* Active Repos */}
        <div className="rounded-lg border border-[#27272A] bg-[#0F0F11] p-2.5 transition-colors hover:border-[#3F3F46]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#A1A1AA]">Active Repos</span>
            <FolderGit2 size={13} className="text-[#71717A]" />
          </div>
          <p className="mt-1 text-lg font-bold text-[#FAFAFA] font-mono">
            {activeRepositories}
          </p>
        </div>
      </div>

      {/* Below 2x2 grid: PRs merged & Issues closed */}
      <div className="grid grid-cols-2 gap-2 pt-0.5">
        <div className="flex items-center justify-between rounded-md border border-[#27272A]/70 bg-[#0F0F11]/60 px-2.5 py-1.5">
          <div className="flex items-center gap-1.5 text-[11px] text-[#71717A]">
            <GitMerge size={12} className="text-emerald-400" />
            <span>PRs merged</span>
          </div>
          <span className="text-xs font-semibold text-[#FAFAFA] font-mono">{mergedPRs}</span>
        </div>

        <div className="flex items-center justify-between rounded-md border border-[#27272A]/70 bg-[#0F0F11]/60 px-2.5 py-1.5">
          <div className="flex items-center gap-1.5 text-[11px] text-[#71717A]">
            <CheckCircle2 size={12} className="text-purple-400" />
            <span>Issues closed</span>
          </div>
          <span className="text-xs font-semibold text-[#FAFAFA] font-mono">{closedIssues}</span>
        </div>
      </div>
    </section>
  );
}