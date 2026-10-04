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
import { CommandPalette } from "./components/command/CommandPalette";
import { NewIssueForm } from "./components/NewIssueForm";
import { getAuth, setAuth, clearAuth } from "../lib/storage/auth";
import { getGitHubUser, GitHubApiError } from "../lib/github/client";
import type { GitHubUser } from "../lib/github/types";
import { usePullRequests } from "./hooks/usePullRequests";
import { useIssues } from "./hooks/useIssues";
import { useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { FeedbackProvider } from "./components/feedback/ToastContext";

function App() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [currentPage, setCurrentPage] = useState<NavPage>("home");
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [newIssueModalOpen, setNewIssueModalOpen] = useState(false);
  const [reposFocusSearch, setReposFocusSearch] = useState(false);
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
    if (!authenticated) return;

    function handleKeyDown(e: KeyboardEvent) {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (isCmdOrCtrl && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [authenticated]);

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
    state?: {
      execMode?: "none" | "create-repo" | "manage-access";
      focusSearch?: boolean;
    }
  ) {
    if (state?.execMode) {
      setExecInitialMode(state.execMode);
    } else {
      setExecInitialMode("none");
    }

    if (state?.focusSearch) {
      setReposFocusSearch(true);
    } else {
      setReposFocusSearch(false);
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

  // 3. Authenticated App Experience (AppShell + Pages + BottomNav + Command Palette)
  return (
    <FeedbackProvider>
      <AppShell
        user={user}
        currentPage={currentPage}
        onSelectPage={(page) => handleNavigate(page)}
        onOpenSearch={() => setCommandPaletteOpen((prev) => !prev)}
        onDisconnect={handleDisconnect}
        inboxCount={inboxCount}
        prsCount={prsCount}
      >
        {currentPage === "home" && (
          <HomePage
            user={user}
            onNavigate={handleNavigate}
            onOpenNewIssue={() => setNewIssueModalOpen(true)}
          />
        )}

        {currentPage === "inbox" && <InboxPage />}

        {currentPage === "prs" && <PullRequestsPage />}

        {currentPage === "repos" && (
          <RepositoriesPage autoFocusSearch={reposFocusSearch} />
        )}

        {currentPage === "exec" && <ExecPage initialMode={execInitialMode} />}

        {currentPage === "settings" && (
          <SettingsPage
            user={user}
            onBack={() => setCurrentPage("home")}
            onDisconnect={handleDisconnect}
          />
        )}
      </AppShell>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={handleNavigate}
        onOpenNewIssue={() => setNewIssueModalOpen(true)}
      />

      {/* Global New Issue Modal */}
      {newIssueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="w-full max-w-sm rounded-xl border border-[#27272A] bg-[#0F0F11] p-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#27272A] pb-2 mb-3">
              <h3 className="text-xs font-semibold text-white">Create GitHub Issue</h3>
              <button
                type="button"
                onClick={() => setNewIssueModalOpen(false)}
                className="rounded p-1 text-[#71717A] hover:bg-[#18181B] hover:text-white cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
            <NewIssueForm onClose={() => setNewIssueModalOpen(false)} />
          </div>
        </div>
      )}
    </FeedbackProvider>
  );
}

export default App;