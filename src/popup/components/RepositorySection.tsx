import { useState } from "react";
import { RepositoryList } from "./RepositoryList";
import type { Filter } from "./RepositoryList";
import { useRepositories } from "../hooks/useRepositories";

export function RepositorySection() {
  const [filter, setFilter] = useState<Filter>("all");
  const {
    data: repositories,
    isLoading,
    isError,
  } = useRepositories(filter === "starred");

  return (
    <section>
      <div className="mb-3">
        <p className="text-xs text-zinc-500">
          Repositories
        </p>

        <h2 className="text-lg font-semibold text-white">
          Your Repositories
        </h2>
      </div>

      {isLoading && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500">
            Loading repositories...
          </p>
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-red-400">
            Failed to load repositories.
          </p>
        </div>
      )}

      {repositories && (
        <RepositoryList
          repositories={repositories}
          filter={filter}
          onFilterChange={setFilter}
        />
      )}
    </section>
  );
}
