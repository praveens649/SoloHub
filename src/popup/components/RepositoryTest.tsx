import { useRepositories } from "../hooks/useRepositories";

export function RepositoryTest() {
  const {
    data: repositories,
    isLoading,
    isError,
    error,
  } = useRepositories();

  if (isLoading) {
    return (
      <p className="text-sm text-zinc-400">
        Loading repositories...
      </p>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-red-400">
        {error instanceof Error
          ? error.message
          : "Failed to load repositories"}
      </p>
    );
  }

  if (!repositories?.length) {
    return (
      <p className="text-sm text-zinc-400">
        No repositories found.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        Repositories ({repositories.length})
      </p>

      {repositories.slice(0, 5).map((repo) => (
        <div
          key={repo.id}
          className="rounded-lg border border-zinc-800 p-3"
        >
          <p className="text-sm font-medium">
            {repo.name}
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            {repo.private ? "Private" : "Public"}
            {" • "}
            {repo.language ?? "No language"}
          </p>
        </div>
      ))}
    </div>
  );
}