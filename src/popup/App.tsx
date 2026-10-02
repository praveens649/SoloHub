import { useEffect, useState } from "react";
import { GitHubConnect } from "./components/GitHubConnect";
import { getAuth, clearAuth } from "../lib/storage/auth";
import { getGitHubUser } from "../lib/github/client";
import { RepositoryTest } from "./components/RepositoryTest";
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
        <p className="text-sm text-zinc-400">
          GitHub connected
        </p>

        <h2 className="mt-1 text-lg font-semibold">
          @{username}
        </h2>
         <div className="mt-4">
    <RepositoryTest />
  </div>
      </section>
    </main>
  );
}

export default App;