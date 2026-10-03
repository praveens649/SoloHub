import { useEffect, useState } from "react";
import { GitHubConnect } from "./components/GitHubConnect";
import { getAuth, setAuth, clearAuth } from "../lib/storage/auth";
import { getGitHubUser, GitHubApiError } from "../lib/github/client";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { TodayProductivity } from "./components/TodayProductivity";
import { ActionCenter } from "./components/ActionCenter";
import { QuickActions } from "./components/QuickActions";
import { PullRequestSection } from "./components/PullRequestSection";
import { IssueSection } from "./components/IssueSection";
import { WeeklyActivity } from "./components/WeeklyActivity";
import { RepositorySection } from "./components/RepositorySection";

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

        if (auth.user) {
          setAuthenticated(true);
          setUsername(auth.user.login);
        }

        // Validate stored token
        const user = await getGitHubUser(auth.token);
        await setAuth(auth.token, user);

        setAuthenticated(true);
        setUsername(user.login);
      } catch (error) {
        console.error("Auth validation failed:", error);

        // Only clear stored authentication on explicit 401 Unauthorized
        if (error instanceof GitHubApiError && error.status === 401) {
          await clearAuth();
          setAuthenticated(false);
        } else {
          // If offline / network error or temporary failure, preserve existing credentials
          const auth = await getAuth();
          if (auth?.token && auth?.user) {
            setAuthenticated(true);
            setUsername(auth.user.login);
          } else {
            setAuthenticated(false);
          }
        }
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
  return (
    <main className="h-[600px] w-[380px] overflow-y-auto bg-zinc-950 p-4 text-white">
      <header className="mb-5">
        <h1 className="text-lg font-semibold">
          Solohub
        </h1>

        <p className="text-xs text-zinc-500">
          {username ? `Signed in as ${username}` : "GitHub Productivity"}
        </p>
      </header>

      <div className="space-y-5">
        <ErrorBoundary>
          <TodayProductivity />
        </ErrorBoundary>

        <ErrorBoundary>
          <ActionCenter />
        </ErrorBoundary>

        <ErrorBoundary>
          <QuickActions />
        </ErrorBoundary>

        <ErrorBoundary>
          <PullRequestSection />
        </ErrorBoundary>

        <ErrorBoundary>
          <IssueSection />
        </ErrorBoundary>

        <ErrorBoundary>
          <WeeklyActivity />
        </ErrorBoundary>

        <ErrorBoundary>
          <RepositorySection />
        </ErrorBoundary>
      </div>
    </main>
  );
}

export default App;