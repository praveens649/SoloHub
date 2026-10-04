import { useEffect, useState, useCallback } from "react";
import { AppShell } from "./components/layout/AppShell";
import { type NavPage } from "./components/layout/BottomNav";
import { HomePage } from "./pages/HomePage";
import { InboxPage } from "./pages/InboxPage";
import { PullRequestsPage } from "./pages/PullRequestsPage";
import { RepositoriesPage } from "./pages/RepositoriesPage";
import { ExecPage } from "./pages/ExecPage";
import { SettingsPage } from "./pages/SettingsPage";
import { HomeHero } from "./components/HomeHero";
import { SearchModal } from "./components/SearchModal";
import { getAuth, setAuth, clearAuth } from "../lib/storage/auth";
import { getGitHubUser, GitHubApiError } from "../lib/github/client";
import type { GitHubUser } from "../lib/github/types";
import { usePullRequests } from "./hooks/usePullRequests";
import { useIssues } from "./hooks/useIssues";
import { useQueryClient } from "@tanstack/react-query";

function App() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [currentPage, setCurrentPage] = useState<NavPage>("home");
  const [searchOpen, setSearchOpen] = useState(false);
  const [execInitialMode, setExecInitialMode] = useState<"none" | "create-repo" | "manage-access">("none");

  const queryClient = useQueryClient();

  const checkAuth = useCallback(async () => {
    try {
      const auth = await getAuth();

      if (!auth?.token) {
        setAuthenticated(false);
        setUser(null);
        return;
      }

      if (auth.user) {
        setAuthenticated(true);
        setUser(auth.user);
      }

      // Validate stored token with GitHub
      const freshUser = await getGitHubUser(auth.token);
      await setAuth(auth.token, freshUser);

      setAuthenticated(true);
      setUser(freshUser);
    } catch (error) {
      console.error("Auth check failed:", error);

      if (error instanceof GitHubApiError && error.status === 401) {
        await clearAuth();
        setAuthenticated(false);
        setUser(null);
      } else {
        const auth = await getAuth();
        if (auth?.token && auth?.user) {
          setAuthenticated(true);
          setUser(auth.user);
        } else {
          setAuthenticated(false);
          setUser(null);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Global keyboard shortcuts (Ctrl+K or Cmd+K)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch counts for badges only when authenticated
  const { data: openPRs } = usePullRequests("open");
  const { data: openIssues } = useIssues("open");

  const prsCount = openPRs?.length ?? 0;
  const inboxCount = (openPRs?.length ?? 0) + (openIssues?.length ?? 0);

  function handleLoginSuccess(authenticatedUser: GitHubUser) {
    setUser(authenticatedUser);
    setAuthenticated(true);
    setCurrentPage("home");
  }

  async function handleDisconnect() {
    await clearAuth();
    queryClient.clear();
    setUser(null);
    setAuthenticated(false);
    setCurrentPage("home");
  }

  function handleNavigate(
    page: NavPage,
    state?: { execMode?: "none" | "create-repo" | "manage-access" }
  ) {
    if (state?.execMode) {
      setExecInitialMode(state.execMode);
    } else {
      setExecInitialMode("none");
    }
    setCurrentPage(page);
  }

  // 1. Initial Loading State
  if (loading) {
    return (
      <div className="flex h-[600px] w-full min-w-[380px] max-w-[420px] mx-auto flex-col items-center justify-center bg-[#090A0F] text-[#FAFAFA]">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#27272A] border-t-white" />
        <p className="mt-3 text-xs text-[#71717A]">Checking connection...</p>
      </div>
    );
  }

  // 2. Unauthenticated Experience (Separate Hero screen)
  if (!authenticated) {
    return (
      <div className="flex h-[600px] w-full min-w-[380px] max-w-[420px] mx-auto flex-col bg-[#090A0F]">
        <HomeHero onSuccess={handleLoginSuccess} />
      </div>
    );
  }

  // 3. Authenticated App Experience (AppShell + Pages + BottomNav)
  return (
    <>
      <AppShell
        user={user}
        currentPage={currentPage}
        onSelectPage={(page) => handleNavigate(page)}
        onOpenSearch={() => setSearchOpen(true)}
        onDisconnect={handleDisconnect}
        inboxCount={inboxCount}
        prsCount={prsCount}
      >
        {currentPage === "home" && (
          <HomePage user={user} onNavigate={handleNavigate} />
        )}

        {currentPage === "inbox" && <InboxPage />}

        {currentPage === "prs" && <PullRequestsPage />}

        {currentPage === "repos" && <RepositoriesPage />}

        {currentPage === "exec" && <ExecPage initialMode={execInitialMode} />}

        {currentPage === "settings" && (
          <SettingsPage
            user={user}
            onBack={() => setCurrentPage("home")}
            onDisconnect={handleDisconnect}
          />
        )}
      </AppShell>

      {/* Global Search Dialog */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </>
  );
}

export default App;