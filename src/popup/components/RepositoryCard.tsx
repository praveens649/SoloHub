import {
  Building2,
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
  currentUserLogin?: string | null;
  isOrg?: boolean;
}

export function RepositoryCard({
  repository,
  currentUserLogin,
  isOrg,
}: RepositoryCardProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const isOrgRepo =
    isOrg ??
    (repository.owner?.type === "Organization" ||
      Boolean(repository.organization) ||
      (currentUserLogin &&
        repository.owner?.login?.toLowerCase() !==
          currentUserLogin.toLowerCase()));

  async function copyToClipboard(value: string, type: string) {
    await navigator.clipboard.writeText(value);
    setCopied(type);
    setTimeout(() => {
      setCopied(null);
    }, 1500);
  }

  function openUrl(url: string) {
    if (typeof chrome !== "undefined" && chrome.tabs?.create) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, "_blank");
    }
  }

  const issuesUrl = `${repository.html_url}/issues`;
  const pullRequestsUrl = `${repository.html_url}/pulls`;
  const createIssueUrl = `${repository.html_url}/issues/new`;

  return (
    <div className="rounded-lg border border-[#27272A] bg-[#0F0F11] p-3 transition-colors hover:border-[#3F3F46]">
      {/* Header */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0 flex-1">
          {/* Organization indicator */}
          {isOrgRepo && repository.owner && (
            <div className="mb-1 flex items-center gap-1.5">
              {repository.owner.avatar_url ? (
                <img
                  src={repository.owner.avatar_url}
                  alt={repository.owner.login}
                  className="h-3.5 w-3.5 rounded-full border border-[#27272A] object-cover"
                />
              ) : (
                <Building2 size={12} className="text-[#A1A1AA]" />
              )}
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  openUrl(`https://github.com/${repository.owner.login}`);
                }}
                className="truncate text-[10px] font-medium text-[#A1A1AA] hover:text-[#FAFAFA] hover:underline cursor-pointer"
                title={`Organization: ${repository.owner.login}`}
              >
                {repository.owner.login}
              </span>
              <span className="rounded border border-purple-800/40 bg-purple-950/40 px-1 py-0.2 text-[8px] font-semibold tracking-wide text-purple-300">
                ORG
              </span>
            </div>
          )}

          <h3
            className="truncate text-xs font-semibold text-[#FAFAFA]"
            title={repository.full_name || repository.name}
          >
            {repository.name}
          </h3>

          <p className="mt-0.5 line-clamp-2 text-[11px] text-[#A1A1AA] leading-relaxed">
            {repository.description || "No description provided"}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-medium ${
            repository.private
              ? "border-[#3F3F46] bg-[#18181B] text-[#A1A1AA]"
              : "border-blue-900/60 bg-blue-950/40 text-blue-400"
          }`}
        >
          {repository.private ? "Private" : "Public"}
        </span>
      </div>

      {/* Language, Stars & Forks */}
      <div className="mt-2.5 flex items-center gap-3 text-[11px] text-[#71717A]">
        {repository.language && (
          <span className="flex items-center gap-1 text-[#A1A1AA]">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            {repository.language}
          </span>
        )}

        <span className="flex items-center gap-1">
          <Star size={11} />
          <span>{repository.stargazers_count}</span>
        </span>

        <span className="flex items-center gap-1">
          <GitFork size={11} />
          <span>{repository.forks_count}</span>
        </span>
      </div>

      {/* Main Action: Open Repository */}
      <button
        type="button"
        onClick={() => openUrl(repository.html_url)}
        className="mt-2.5 flex h-7 w-full items-center justify-center gap-1.5 rounded-md border border-[#27272A] bg-[#090A0F] px-3 text-xs font-medium text-[#FAFAFA] transition-colors hover:bg-[#18181B] active:scale-[0.99] cursor-pointer"
      >
        <span>Open Repository</span>
        <ExternalLink size={12} className="text-[#A1A1AA]" />
      </button>

      {/* Quick Links: Issues, PRs, New Issue */}
      <div className="mt-1.5 grid grid-cols-3 gap-1.5">
        <button
          type="button"
          onClick={() => openUrl(issuesUrl)}
          className="flex h-6 items-center justify-center gap-1 rounded-md border border-[#27272A] bg-[#090A0F]/60 px-1 text-[10px] font-medium text-[#A1A1AA] transition-colors hover:bg-[#18181B] hover:text-[#FAFAFA] cursor-pointer"
        >
          <CircleDot size={10} />
          <span>Issues</span>
        </button>

        <button
          type="button"
          onClick={() => openUrl(pullRequestsUrl)}
          className="flex h-6 items-center justify-center gap-1 rounded-md border border-[#27272A] bg-[#090A0F]/60 px-1 text-[10px] font-medium text-[#A1A1AA] transition-colors hover:bg-[#18181B] hover:text-[#FAFAFA] cursor-pointer"
        >
          <GitPullRequest size={10} />
          <span>PRs</span>
        </button>

        <button
          type="button"
          onClick={() => openUrl(createIssueUrl)}
          className="flex h-6 items-center justify-center gap-1 rounded-md border border-[#27272A] bg-[#090A0F]/60 px-1 text-[10px] font-medium text-[#A1A1AA] transition-colors hover:bg-[#18181B] hover:text-[#FAFAFA] cursor-pointer"
        >
          <CircleDot size={10} className="text-emerald-400" />
          <span>New Issue</span>
        </button>
      </div>

      {/* Clone Protocols: HTTPS & SSH */}
      <div className="mt-1.5 grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => copyToClipboard(repository.clone_url, "https")}
          className="flex h-6 items-center justify-center gap-1 rounded-md border border-[#27272A] bg-[#090A0F]/60 px-1 text-[10px] text-[#71717A] transition-colors hover:bg-[#18181B] hover:text-[#FAFAFA] cursor-pointer"
        >
          {copied === "https" ? (
            <Check size={10} className="text-emerald-400" />
          ) : (
            <Copy size={10} />
          )}
          <span>{copied === "https" ? "Copied HTTPS" : "HTTPS"}</span>
        </button>

        <button
          type="button"
          onClick={() => copyToClipboard(repository.ssh_url, "ssh")}
          className="flex h-6 items-center justify-center gap-1 rounded-md border border-[#27272A] bg-[#090A0F]/60 px-1 text-[10px] text-[#71717A] transition-colors hover:bg-[#18181B] hover:text-[#FAFAFA] cursor-pointer"
        >
          {copied === "ssh" ? (
            <Check size={10} className="text-emerald-400" />
          ) : (
            <Copy size={10} />
          )}
          <span>{copied === "ssh" ? "Copied SSH" : "SSH"}</span>
        </button>
      </div>
    </div>
  );
}