import { useState, useMemo } from "react";
import { useRepositories } from "../hooks/useRepositories";
import { RepositoryCard } from "../components/RepositoryCard";
import { GitHubRateLimitMessage } from "../components/GitHubRateLimitMessage";
import { Search } from "lucide-react";

export type RepoFilter = "all" | "public" | "private" | "starred";

export function RepositoriesPage() {
  const [filter, setFilter] = useState<RepoFilter>("all");
  const [search, setSearch] = useState("");

  // Hook handles starred query parameter directly
  const {
    data: repositories,
    isLoading,
    isError,
    error,
    refetch,
  } = useRepositories(filter === "starred");

  const filteredRepositories = useMemo(() => {
    if (!repositories) return [];

    return repositories.filter((repository) => {
      const matchesSearch =
        repository.name.toLowerCase().includes(search.toLowerCase()) ||
        (repository.description &&
          repository.description.toLowerCase().includes(search.toLowerCase()));

      const matchesVisibility =
        filter === "all" ||
        filter === "starred" ||
        (filter === "public" && !repository.private) ||
        (filter === "private" && repository.private);

      return matchesSearch && matchesVisibility;
    });
  }, [repositories, search, filter]);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div>
        <p className="text-[11px] text-[#71717A]">Repositories</p>
        <h1 className="text-base font-bold text-[#FAFAFA]">Your Repositories</h1>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search
          size={14}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#71717A]"
        />
        <input
          type="text"
          placeholder="Search repositories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 w-full rounded-lg border border-[#27272A] bg-[#0F0F11] pl-8 pr-3 text-xs text-[#FAFAFA] placeholder-[#71717A] outline-none transition-colors focus:border-[#3F3F46]"
        />
      </div>

      {/* Filters & Count */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-0.5 rounded-lg border border-[#27272A] bg-[#0F0F11] p-0.5">
          {(["all", "public", "private", "starred"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={`rounded-md px-2 py-0.5 text-[10px] font-semibold capitalize transition-colors cursor-pointer ${
                filter === option
                  ? "bg-[#FAFAFA] text-[#090A0F]"
                  : "text-[#71717A] hover:text-[#FAFAFA]"
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        <span className="text-[11px] text-[#71717A] font-mono">
          {filteredRepositories.length} repos
        </span>
      </div>

      {/* Loading state */}
      {isLoading && !repositories && (
        <div className="rounded-lg border border-[#27272A] bg-[#0F0F11] p-4 text-center">
          <p className="text-xs text-[#71717A]">Loading repositories...</p>
        </div>
      )}

      {/* Error state */}
      {isError && !repositories && (
        <GitHubRateLimitMessage error={error} onRetry={() => refetch()} />
      )}

      {/* Repositories List */}
      {repositories && (
        <div className="space-y-2">
          {filteredRepositories.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#27272A] bg-[#0F0F11]/50 p-6 text-center">
              <p className="text-xs text-[#71717A]">
                {search.trim()
                  ? `No repositories found matching "${search}".`
                  : "No repositories found."}
              </p>
            </div>
          ) : (
            filteredRepositories.map((repo) => (
              <RepositoryCard key={repo.id} repository={repo} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
