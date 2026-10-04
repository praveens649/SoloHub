import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useRepositories } from "../hooks/useRepositories";
import { useOrganizations } from "../hooks/useOrganizations";
import { RepositoryCard } from "../components/RepositoryCard";
import { GitHubRateLimitMessage } from "../components/GitHubRateLimitMessage";
import { Search, Building2 } from "lucide-react";
import { CardSkeleton } from "../components/feedback/Skeletons";
import { getAuth } from "../../lib/storage/auth";
import type { GitHubRepository } from "../../lib/github/types";

export type RepoFilter = "all" | "personal" | "orgs" | "public" | "private" | "starred";

interface RepositoriesPageProps {
  autoFocusSearch?: boolean;
  initialFilter?: RepoFilter;
}

export function RepositoriesPage({
  autoFocusSearch = false,
  initialFilter = "all",
}: RepositoriesPageProps) {
  const [filter, setFilter] = useState<RepoFilter>(initialFilter);
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentUserLogin, setCurrentUserLogin] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getAuth().then((auth) => {
      if (auth?.user?.login) {
        setCurrentUserLogin(auth.user.login);
      }
    });
  }, []);

  useEffect(() => {
    if (autoFocusSearch) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [autoFocusSearch]);

  const { data: organizations } = useOrganizations();

  // Hook handles starred query parameter directly; organization repos are included
  const {
    data: repositories,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useRepositories(filter === "starred");

  // Determine whether a repository belongs to an organization
  const isRepoOrg = useCallback(
    (repo: GitHubRepository) => {
      if (repo.owner?.type === "Organization") return true;
      if (repo.organization) return true;
      if (
        organizations &&
        organizations.some(
          (o) => o.login.toLowerCase() === repo.owner?.login?.toLowerCase()
        )
      ) {
        return true;
      }
      if (
        currentUserLogin &&
        repo.owner?.login &&
        repo.owner.login.toLowerCase() !== currentUserLogin.toLowerCase()
      ) {
        return true;
      }
      return false;
    },
    [organizations, currentUserLogin]
  );

  // Counts by organization
  const { orgReposCount, orgRepoCounts } = useMemo(() => {
    if (!repositories) return { orgReposCount: 0, orgRepoCounts: {} as Record<string, number> };

    const counts: Record<string, number> = {};
    let totalOrgs = 0;

    for (const repo of repositories) {
      if (isRepoOrg(repo)) {
        totalOrgs++;
        const orgKey = repo.owner?.login?.toLowerCase() || "unknown";
        counts[orgKey] = (counts[orgKey] || 0) + 1;
      }
    }

    return { orgReposCount: totalOrgs, orgRepoCounts: counts };
  }, [repositories, isRepoOrg]);

  const filteredRepositories = useMemo(() => {
    if (!repositories) return [];

    return repositories.filter((repository) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        repository.name.toLowerCase().includes(q) ||
        repository.full_name?.toLowerCase().includes(q) ||
        repository.owner?.login?.toLowerCase().includes(q) ||
        Boolean(
          repository.description &&
            repository.description.toLowerCase().includes(q)
        );

      const isOrg = isRepoOrg(repository);

      let matchesFilter = true;
      if (filter === "personal") {
        matchesFilter = !isOrg;
      } else if (filter === "orgs") {
        if (!isOrg) {
          matchesFilter = false;
        } else if (selectedOrg) {
          matchesFilter =
            repository.owner?.login?.toLowerCase() === selectedOrg.toLowerCase();
        }
      } else if (filter === "public") {
        matchesFilter = !repository.private;
      } else if (filter === "private") {
        matchesFilter = repository.private;
      }
      // "all" and "starred" match all repositories in current dataset

      return matchesSearch && matchesFilter;
    });
  }, [repositories, search, filter, selectedOrg, isRepoOrg]);

  const filterOptions: { id: RepoFilter; label: string; badge?: number }[] = [
    { id: "all", label: "all" },
    { id: "personal", label: "personal" },
    { id: "orgs", label: "orgs", badge: orgReposCount > 0 ? orgReposCount : undefined },
    { id: "public", label: "public" },
    { id: "private", label: "private" },
    { id: "starred", label: "starred" },
  ];

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
          ref={searchInputRef}
          type="text"
          placeholder="Search repositories, orgs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 w-full rounded-lg border border-[#27272A] bg-[#0F0F11] pl-8 pr-3 text-xs text-[#FAFAFA] placeholder-[#71717A] outline-none transition-colors focus:border-[#3F3F46]"
        />
      </div>

      {/* Filters & Count */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-0.5 overflow-x-auto rounded-lg border border-[#27272A] bg-[#0F0F11] p-0.5 no-scrollbar">
          {filterOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                setFilter(opt.id);
                if (opt.id !== "orgs") {
                  setSelectedOrg(null);
                }
              }}
              className={`flex items-center gap-1 shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold capitalize transition-colors cursor-pointer ${
                filter === opt.id
                  ? "bg-[#FAFAFA] text-[#090A0F]"
                  : "text-[#71717A] hover:text-[#FAFAFA]"
              }`}
            >
              <span>{opt.label}</span>
              {opt.badge !== undefined && (
                <span
                  className={`rounded-full px-1 text-[8px] font-bold ${
                    filter === opt.id
                      ? "bg-[#090A0F]/20 text-[#090A0F]"
                      : "bg-[#27272A] text-[#A1A1AA]"
                  }`}
                >
                  {opt.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isFetching && repositories && (
            <span className="text-[10px] text-zinc-500 animate-pulse">Refreshing...</span>
          )}
          <span className="text-[11px] text-[#71717A] font-mono">
            {filteredRepositories.length}{" "}
            {filter === "orgs" ? "org repos" : "repos"}
          </span>
        </div>
      </div>

      {/* Organization Pills Sub-bar (when 'orgs' filter is selected and orgs exist) */}
      {filter === "orgs" && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-0.5 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedOrg(null)}
            className={`flex items-center gap-1 shrink-0 rounded-md border px-2 py-1 text-[10px] font-medium transition-colors cursor-pointer ${
              selectedOrg === null
                ? "border-purple-600/80 bg-purple-950/40 text-purple-200"
                : "border-[#27272A] bg-[#0F0F11] text-[#71717A] hover:text-[#FAFAFA]"
            }`}
          >
            <Building2 size={11} />
            <span>All Orgs ({orgReposCount})</span>
          </button>

          {organizations &&
            organizations.map((org) => {
              const count = orgRepoCounts[org.login.toLowerCase()] || 0;
              const isSelected = selectedOrg?.toLowerCase() === org.login.toLowerCase();

              return (
                <button
                  key={org.id}
                  type="button"
                  onClick={() => setSelectedOrg(isSelected ? null : org.login)}
                  className={`flex items-center gap-1.5 shrink-0 rounded-md border px-2 py-1 text-[10px] font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? "border-purple-600/80 bg-purple-950/40 text-purple-200"
                      : "border-[#27272A] bg-[#0F0F11] text-[#71717A] hover:text-[#FAFAFA]"
                  }`}
                >
                  {org.avatar_url ? (
                    <img
                      src={org.avatar_url}
                      alt={org.login}
                      className="h-3 w-3 rounded-full object-cover"
                    />
                  ) : (
                    <Building2 size={11} />
                  )}
                  <span>{org.login}</span>
                  <span className="text-[9px] opacity-70">({count})</span>
                </button>
              );
            })}
        </div>
      )}

      {/* Loading state */}
      {isLoading && !repositories && <CardSkeleton count={3} />}

      {/* Error state */}
      {isError && !repositories && (
        <GitHubRateLimitMessage error={error} onRetry={() => refetch()} />
      )}

      {/* Repositories List */}
      {repositories && (
        <div className="space-y-2">
          {filteredRepositories.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#27272A] bg-[#0F0F11]/50 p-6 text-center">
              {filter === "orgs" ? (
                <div className="space-y-1.5">
                  <Building2 size={22} className="mx-auto text-[#71717A]" />
                  <p className="text-xs font-semibold text-[#FAFAFA]">
                    No organization repositories found
                  </p>
                  <p className="text-[11px] text-[#71717A] max-w-[280px] mx-auto leading-relaxed">
                    {search.trim()
                      ? `No organization repositories matching "${search}".`
                      : organizations && organizations.length > 0
                      ? `No accessible repositories found for ${
                          selectedOrg ? `@${selectedOrg}` : "your organizations"
                        }.`
                      : "You are not a member of any organizations, or your token needs the 'read:org' scope."}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-[#71717A]">
                  {search.trim()
                    ? `No repositories found matching "${search}".`
                    : "No repositories found."}
                </p>
              )}
            </div>
          ) : (
            filteredRepositories.map((repo) => (
              <RepositoryCard
                key={repo.id}
                repository={repo}
                currentUserLogin={currentUserLogin}
                isOrg={isRepoOrg(repo)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
