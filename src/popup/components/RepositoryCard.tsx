import {
  Check,
  CircleDot,
  Copy,
  ExternalLink,
  GitFork,
  GitPullRequest,
  Star,
} from "lucide-react";
import { useState } from "react";
import type { GitHubRepository } from "../../lib/github/types";

interface RepositoryCardProps {
  repository: GitHubRepository;
}

export function RepositoryCard({
  repository,
}: RepositoryCardProps) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copyToClipboard(
    value: string,
    type: string
  ) {
    await navigator.clipboard.writeText(value);

    setCopied(type);

    setTimeout(() => {
      setCopied(null);
    }, 1500);
  }

  function openUrl(url: string) {
    chrome.tabs.create({ url });
  }

  const issuesUrl = `${repository.html_url}/issues`;
  const pullRequestsUrl = `${repository.html_url}/pulls`;
  const createIssueUrl = `${repository.html_url}/issues/new`;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-white">
            {repository.name}
          </h3>

          <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
            {repository.description || "No description"}
          </p>
        </div>

        <span className="shrink-0 rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-400">
          {repository.private ? "Private" : "Public"}
        </span>
      </div>

      {/* Stats */}
      <div className="mt-3 flex items-center gap-3 text-xs text-zinc-500">
        <span>{repository.language || "Unknown"}</span>

        <span className="flex items-center gap-1">
          <Star size={12} />
          {repository.stargazers_count}
        </span>

        <span className="flex items-center gap-1">
          <GitFork size={12} />
          {repository.forks_count}
        </span>
      </div>

      {/* Main action */}
      <button
        onClick={() => openUrl(repository.html_url)}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
      >
        Open Repository
        <ExternalLink size={13} />
      </button>

      {/* Quick actions */}
      <div className="mt-2 grid grid-cols-3 gap-2">
        <button
          onClick={() => openUrl(issuesUrl)}
          className="flex items-center justify-center gap-1 rounded-md border border-zinc-800 px-2 py-1.5 text-[11px] text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
        >
          <CircleDot size={12} />
          Issues
        </button>

        <button
          onClick={() => openUrl(pullRequestsUrl)}
          className="flex items-center justify-center gap-1 rounded-md border border-zinc-800 px-2 py-1.5 text-[11px] text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
        >
          <GitPullRequest size={12} />
          PRs
        </button>

        <button
          onClick={() => openUrl(createIssueUrl)}
          className="flex items-center justify-center gap-1 rounded-md border border-zinc-800 px-2 py-1.5 text-[11px] text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
        >
          <CircleDot size={12} />
          New Issue
        </button>
      </div>

      {/* Clone URLs */}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          onClick={() =>
            copyToClipboard(repository.clone_url, "https")
          }
          className="flex items-center justify-center gap-1 rounded-md border border-zinc-800 px-2 py-1.5 text-[11px] text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300"
        >
          {copied === "https" ? (
            <Check size={12} />
          ) : (
            <Copy size={12} />
          )}
          {copied === "https" ? "Copied" : "HTTPS"}
        </button>

        <button
          onClick={() =>
            copyToClipboard(repository.ssh_url, "ssh")
          }
          className="flex items-center justify-center gap-1 rounded-md border border-zinc-800 px-2 py-1.5 text-[11px] text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300"
        >
          {copied === "ssh" ? (
            <Check size={12} />
          ) : (
            <Copy size={12} />
          )}
          {copied === "ssh" ? "Copied" : "SSH"}
        </button>
      </div>
    </div>
  );
}