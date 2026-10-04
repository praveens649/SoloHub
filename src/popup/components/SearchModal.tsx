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
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 p-4 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="w-full max-w-sm rounded-xl border border-[#27272A] bg-[#090A0F] shadow-2xl overflow-hidden mt-6">
        {/* Search Header */}
        <div className="flex items-center gap-2 border-b border-[#27272A] px-3 py-2.5 bg-[#0F0F11]">
          <Search size={15} className="text-[#71717A]" />
          <input
            type="text"
            autoFocus
            placeholder="Search repos, pull requests, issues..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-xs text-[#FAFAFA] placeholder-[#71717A] focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[#71717A] hover:bg-[#18181B] hover:text-[#FAFAFA] cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[340px] overflow-y-auto p-3 space-y-3">
          {!query.trim() && (
            <div className="py-6 text-center text-xs text-[#71717A]">
              Type to search repositories, open PRs, and issues.
            </div>
          )}

          {query.trim() && !hasResults && (
            <div className="py-6 text-center text-xs text-[#71717A]">
              No items matching "{query}".
            </div>
          )}

          {filteredRepos.length > 0 && (
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#71717A]">
                Repositories
              </p>
              <div className="space-y-1">
                {filteredRepos.map((repo) => (
                  <button
                    key={repo.id}
                    onClick={() => handleOpenUrl(repo.html_url)}
                    className="flex w-full items-center justify-between rounded-lg p-2 text-left text-xs text-[#A1A1AA] hover:bg-[#0F0F11] hover:text-[#FAFAFA] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FolderGit2 size={13} className="text-[#71717A] shrink-0" />
                      <span className="truncate font-medium">{repo.name}</span>
                    </div>
                    <ExternalLink size={11} className="text-[#71717A] shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredPRs.length > 0 && (
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#71717A]">
                Pull Requests
              </p>
              <div className="space-y-1">
                {filteredPRs.map((pr) => (
                  <button
                    key={pr.id}
                    onClick={() => handleOpenUrl(pr.html_url)}
                    className="flex w-full items-center justify-between rounded-lg p-2 text-left text-xs text-[#A1A1AA] hover:bg-[#0F0F11] hover:text-[#FAFAFA] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <GitPullRequest size={13} className="text-blue-400 shrink-0" />
                      <span className="truncate font-medium">{pr.title}</span>
                    </div>
                    <ExternalLink size={11} className="text-[#71717A] shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredIssues.length > 0 && (
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#71717A]">
                Issues
              </p>
              <div className="space-y-1">
                {filteredIssues.map((issue) => (
                  <button
                    key={issue.id}
                    onClick={() => handleOpenUrl(issue.html_url)}
                    className="flex w-full items-center justify-between rounded-lg p-2 text-left text-xs text-[#A1A1AA] hover:bg-[#0F0F11] hover:text-[#FAFAFA] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <CircleDot size={13} className="text-amber-400 shrink-0" />
                      <span className="truncate font-medium">{issue.title}</span>
                    </div>
                    <ExternalLink size={11} className="text-[#71717A] shrink-0" />
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
