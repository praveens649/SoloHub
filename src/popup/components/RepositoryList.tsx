import { useMemo, useState } from "react";
import type { GitHubRepository } from "../../lib/github/types";
import { RepositoryCard } from "./RepositoryCard";

interface RepositoryListProps {
  repositories: GitHubRepository[];
  filter: Filter;
  onFilterChange: (filter: Filter) => void;
}

export type Filter = "all" | "public" | "private" | "starred";

export function RepositoryList({
  repositories,
  filter,
  onFilterChange,
}: RepositoryListProps) {
  const [search, setSearch] = useState("");

  const filteredRepositories = useMemo(() => {
    return repositories.filter((repository) => {
      const matchesSearch =
        repository.name
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesFilter =
        filter === "all" ||
        (filter === "public" && !repository.private) ||
        (filter === "private" && repository.private) ||
        filter === "starred";

      return matchesSearch && matchesFilter;
    });
  }, [repositories, search, filter]);

  return (
    <div className="space-y-3">
      {/* Search */}
      <input
        type="text"
        placeholder="Search repositories..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
      />

      {/* Filters */}
      <div className="flex gap-2">
        {(["all", "public", "private", "starred"] as Filter[]).map(
          (option) => (
            <button
              key={option}
              onClick={() => onFilterChange(option)}
              className={`rounded-md px-3 py-1 text-xs capitalize transition ${
                filter === option
                  ? "bg-white text-black"
                  : "border border-zinc-800 text-zinc-400 hover:bg-zinc-900"
              }`}
            >
              {option}
            </button>
          )
        )}
      </div>

      {/* Result count */}
      <p className="text-xs text-zinc-500">
        {filteredRepositories.length} repositories
      </p>

      {/* Repository cards */}
      <div className="space-y-2">
        {filteredRepositories.map((repository) => (
          <RepositoryCard
            key={repository.id}
            repository={repository}
          />
        ))}
      </div>

      {/* Empty state */}
      {filteredRepositories.length === 0 && (
        <div className="rounded-lg border border-dashed border-zinc-800 p-6 text-center">
          <p className="text-xs text-zinc-500">
            No repositories found.
          </p>
        </div>
      )}
    </div>
  );
}