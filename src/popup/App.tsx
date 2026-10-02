import { useEffect, useState } from "react";
import { GitHubConnect } from "./components/GitHubConnect";
import { getAuth, clearAuth } from "../lib/storage/auth";
import { getGitHubUser } from "../lib/github/client";
import { RepositoryList } from "./components/RepositoryList";
import type { Filter } from "./components/RepositoryList";
import { useRepositories } from "./hooks/useRepositories";

function App() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    async function initializeAuth() {
      try {
        const auth = await getAuth();

        if (!auth?.token) {
          setAuthenticated(false);
          return;
        }

        // Validate stored token
        const user = await getGitHubUser(auth.token);

        setAuthenticated(true);
        setUsername(user.login);
      } catch (error) {
        console.error("Auth validation failed:", error);

        await clearAuth();

        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    }

    initializeAuth();
  }, []);

  if (loading) {
    return (
      <main className="min-h-[500px] w-[380px] bg-zinc-950 p-4 text-white">
        <p className="text-sm text-zinc-400">
          Checking GitHub connection...
        </p>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="min-h-[500px] w-[380px] bg-zinc-950 text-white">
        <header className="border-b border-zinc-800 px-4 py-3">
          <h1 className="text-lg font-semibold">
            Solohub
          </h1>

          <p className="text-xs text-zinc-400">
            GitHub Productivity
          </p>
        </header>

        <section className="p-4">
          <GitHubConnect />
        </section>
      </main>
    );
  }

  return <Dashboard username={username} />;
}

function Dashboard({ username }: { username: string | null }) {
  const [filter, setFilter] = useState<Filter>("all");
  const {
    data: repositories,
    isLoading,
    isError,
  } = useRepositories(filter === "starred");

  return (
    <main className="min-h-[500px] w-[380px] bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 px-4 py-3">
        <h1 className="text-lg font-semibold">
          Solohub
        </h1>

        <p className="text-xs text-zinc-400">
          {username ? `Signed in as ${username}` : "GitHub Productivity"}
        </p>
      </header>

      <section className="p-4">
        <div className="mb-4">
          <p className="text-xs text-zinc-500">
            Repositories
          </p>

          <h2 className="text-lg font-semibold">
            Your Repositories
          </h2>
        </div>

        {isLoading && (
          <p className="text-sm text-zinc-500">
            Loading repositories...
          </p>
        )}

        {isError && (
          <p className="text-sm text-red-400">
            Failed to load repositories.
          </p>
        )}

        {repositories && (
          <RepositoryList
            repositories={repositories}
            filter={filter}
            onFilterChange={setFilter}
          />
        )}
      </section>
    </main>
  );
}

export default App;