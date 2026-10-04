import { useState, useMemo } from "react";
import { Search, X, GitPullRequest, FolderGit2, CircleDot, ExternalLink } from "lucide-react";
import { useRepositories } from "../hooks/useRepositories";
import { usePullRequests } from "../hooks/usePullRequests";
import { useIssues } from "../hooks/useIssues";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const { data: repositories } = useRepositories();
  const { data: pullRequests } = usePullRequests("open");
  const { data: issues } = useIssues("open");

  const filteredRepos = useMemo(() => {
    if (!query.trim() || !repositories) return [];
    const q = query.toLowerCase();
    return repositories.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
    ).slice(0, 4);
  }, [query, repositories]);

  const filteredPRs = useMemo(() => {
    if (!query.trim() || !pullRequests) return [];
    const q = query.toLowerCase();
    return pullRequests.filter(
      (pr) =>
        pr.title.toLowerCase().includes(q) ||
        pr.repository?.name.toLowerCase().includes(q)
    ).slice(0, 4);
  }, [query, pullRequests]);

  const filteredIssues = useMemo(() => {
    if (!query.trim() || !issues) return [];
    const q = query.toLowerCase();
    return issues.filter(
      (issue) =>
        issue.title.toLowerCase().includes(q) ||
        issue.repository?.name.toLowerCase().includes(q)
    ).slice(0, 4);
  }, [query, issues]);

  if (!isOpen) return null;

  function handleOpenUrl(url: string) {
    if (typeof chrome !== "undefined" && chrome.tabs?.create) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, "_blank");
    }
    onClose();
  }

  const hasResults =
    filteredRepos.length > 0 ||
    filteredPRs.length > 0 ||
    filteredIssues.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden mt-6">
        {/* Search Header */}
        <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2.5 bg-zinc-900/60">
          <Search size={16} className="text-zinc-400" />
          <input
            type="text"
            autoFocus
            placeholder="Search repos, pull requests, issues..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X size={15} />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[360px] overflow-y-auto p-3 space-y-3">
          {!query.trim() && (
            <div className="py-6 text-center text-xs text-zinc-500">
              Type to instantly search across all repositories, open PRs, and issues.
            </div>
          )}

          {query.trim() && !hasResults && (
            <div className="py-6 text-center text-xs text-zinc-500">
              No matching items found for "{query}".
            </div>
          )}

          {filteredRepos.length > 0 && (
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Repositories
              </p>
              <div className="space-y-1">
                {filteredRepos.map((repo) => (
                  <button
                    key={repo.id}
                    onClick={() => handleOpenUrl(repo.html_url)}
                    className="flex w-full items-center justify-between rounded-lg p-2 text-left text-xs text-zinc-300 hover:bg-zinc-900 hover:text-white transition"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FolderGit2 size={14} className="text-zinc-400 shrink-0" />
                      <span className="truncate font-medium">{repo.name}</span>
                    </div>
                    <ExternalLink size={12} className="text-zinc-500 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredPRs.length > 0 && (
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Pull Requests
              </p>
              <div className="space-y-1">
                {filteredPRs.map((pr) => (
                  <button
                    key={pr.id}
                    onClick={() => handleOpenUrl(pr.html_url)}
                    className="flex w-full items-center justify-between rounded-lg p-2 text-left text-xs text-zinc-300 hover:bg-zinc-900 hover:text-white transition"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <GitPullRequest size={14} className="text-emerald-400 shrink-0" />
                      <span className="truncate font-medium">{pr.title}</span>
                    </div>
                    <ExternalLink size={12} className="text-zinc-500 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredIssues.length > 0 && (
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Issues
              </p>
              <div className="space-y-1">
                {filteredIssues.map((issue) => (
                  <button
                    key={issue.id}
                    onClick={() => handleOpenUrl(issue.html_url)}
                    className="flex w-full items-center justify-between rounded-lg p-2 text-left text-xs text-zinc-300 hover:bg-zinc-900 hover:text-white transition"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <CircleDot size={14} className="text-amber-400 shrink-0" />
                      <span className="truncate font-medium">{issue.title}</span>
                    </div>
                    <ExternalLink size={12} className="text-zinc-500 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
