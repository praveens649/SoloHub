import type { GitHubRepository } from "../../lib/github/types";
import { ExternalLink, GitFork, Star } from "lucide-react";

interface RepositoryCardProps {
  repository: GitHubRepository;
}

export function RepositoryCard({
  repository,
}: RepositoryCardProps) {
  function openRepository() {
    chrome.tabs.create({
      url: repository.html_url,
    });
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
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

      <div className="mt-3 flex items-center gap-3 text-xs text-zinc-500">
        <span>
          {repository.language || "Unknown"}
        </span>

        <span className="flex items-center gap-1">
          <Star size={12} />
          {repository.stargazers_count}
        </span>

        <span className="flex items-center gap-1">
          <GitFork size={12} />
          {repository.forks_count}
        </span>
      </div>

      <button
        onClick={openRepository}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
      >
        Open Repository
        <ExternalLink size={13} />
      </button>
    </div>
  );
}