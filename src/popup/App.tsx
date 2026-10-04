import { useEffect, useState, useCallback } from "react";
import { Header } from "./components/Header";
import { BottomNav, type NavTab } from "./components/BottomNav";
import { HomeHero } from "./components/HomeHero";
import { InboxSection } from "./components/InboxSection";
import { ExecSection } from "./components/ExecSection";
import { PullRequestSection } from "./components/PullRequestSection";
import { RepositorySection } from "./components/RepositorySection";
import { IssueSection } from "./components/IssueSection";
import { TodayProductivity } from "./components/TodayProductivity";
import { WeeklyActivity } from "./components/WeeklyActivity";
import { ActionCenter } from "./components/ActionCenter";
import { QuickActions } from "./components/QuickActions";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { SearchModal } from "./components/SearchModal";
import { SettingsModal } from "./components/SettingsModal";
import { ProfileModal } from "./components/ProfileModal";
import { getAuth, setAuth, clearAuth } from "../lib/storage/auth";
import { getGitHubUser, GitHubApiError } from "../lib/github/client";
import type { GitHubUser } from "../lib/github/types";
import { Terminal, ArrowRight } from "lucide-react";
import { GithubIcon } from "./components/Icons";

function App() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [currentTab, setCurrentTab] = useState<NavTab>("home");
  
  // Modals state
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Home view mode: "dashboard" or "hero"
  const [homeViewMode, setHomeViewMode] = useState<"dashboard" | "hero">("dashboard");

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

      // Validate stored token against GitHub API
      const freshUser = await getGitHubUser(auth.token);
      await setAuth(auth.token, freshUser);

      setAuthenticated(true);
      setUser(freshUser);
    } catch (error) {
      console.error("Auth validation failed:", error);

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

  // Global keyboard shortcuts (Ctrl+K or Cmd+K for search)
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

  function handleLoginSuccess(authenticatedUser: GitHubUser) {
    setUser(authenticatedUser);
    setAuthenticated(true);
    setHomeViewMode("dashboard");
  }

  function handleLogout() {
    setUser(null);
    setAuthenticated(false);
    setCurrentTab("home");
  }

  return (
    <div className="flex h-[620px] w-full min-w-[380px] max-w-[420px] mx-auto flex-col overflow-hidden bg-zinc-950 text-white shadow-2xl relative font-sans">
      {/* Top Header matching mockup */}
      <Header
        user={user}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col">
        {loading ? (
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
            <p className="mt-3 text-xs text-zinc-400">Loading SoloHub...</p>
          </div>
        ) : (
          <TabContent
            authenticated={authenticated}
            currentTab={currentTab}
            user={user}
            homeViewMode={homeViewMode}
            onToggleHomeViewMode={() =>
              setHomeViewMode((prev) => (prev === "dashboard" ? "hero" : "dashboard"))
            }
            onLoginSuccess={handleLoginSuccess}
            onSelectTab={setCurrentTab}
          />
        )}
      </main>

      {/* Bottom Navigation Bar with 5 tabs */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
      />

      {/* Interactive Modals */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onAuthChanged={checkAuth}
      />

      <ProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        user={user}
        onLogout={handleLogout}
      />
    </div>
  );
}

interface TabContentProps {
  authenticated: boolean;
  currentTab: NavTab;
  user: GitHubUser | null;
  homeViewMode: "dashboard" | "hero";
  onToggleHomeViewMode: () => void;
  onLoginSuccess: (user: GitHubUser) => void;
  onSelectTab: (tab: NavTab) => void;
}

function TabContent({
  authenticated,
  currentTab,
  user,
  homeViewMode,
  onToggleHomeViewMode,
  onLoginSuccess,
  onSelectTab,
}: TabContentProps) {
  // If not authenticated, always show the exact Hero landing view matching the user's mockup
  if (!authenticated) {
    if (currentTab === "home") {
      return (
        <HomeHero
          onSuccess={onLoginSuccess}
          authenticated={false}
        />
      );
    }

    // If unauthenticated and clicking another tab, show a helpful dark prompt preview
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 mb-4">
          <Terminal className="h-6 w-6 text-zinc-400" />
        </div>
        <h3 className="text-base font-bold text-white capitalize">{currentTab} Preview</h3>
        <p className="mt-1.5 text-xs text-zinc-400 max-w-xs">
          Connect your GitHub account to access live {currentTab} tracking, productivity analytics, and automation.
        </p>
        <button
          type="button"
          onClick={() => onSelectTab("home")}
          className="mt-5 flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200 cursor-pointer"
        >
          <GithubIcon className="h-4 w-4" />
          <span>Go to Connect</span>
        </button>
      </div>
    );
  }

  // When authenticated, render the respective tab content
  switch (currentTab) {
    case "home":
      if (homeViewMode === "hero") {
        return (
          <div className="flex flex-1 flex-col">
            <div className="px-4 pt-3 flex justify-end">
              <button
                type="button"
                onClick={onToggleHomeViewMode}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition"
              >
                Back to Dashboard <ArrowRight size={12} />
              </button>
            </div>
            <HomeHero
              onSuccess={onLoginSuccess}
              authenticated={true}
              username={user?.login}
              onExploreDashboard={onToggleHomeViewMode}
            />
          </div>
        );
      }

      return (
        <div className="p-4 space-y-5">
          {/* Welcome status bar */}
          <div className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <p className="text-xs font-semibold text-white">
                  Welcome, @{user?.login}
                </p>
                <p className="text-[11px] text-zinc-400">
                  Control center online
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleHomeViewMode}
              className="text-[11px] text-zinc-400 hover:text-white transition underline-offset-2 hover:underline"
            >
              Hero View
            </button>
          </div>

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
      );

    case "inbox":
      return (
        <div className="p-4">
          <ErrorBoundary>
            <InboxSection />
          </ErrorBoundary>
        </div>
      );

    case "prs":
      return (
        <div className="p-4">
          <ErrorBoundary>
            <PullRequestSection />
          </ErrorBoundary>
        </div>
      );

    case "repos":
      return (
        <div className="p-4">
          <ErrorBoundary>
            <RepositorySection />
          </ErrorBoundary>
        </div>
      );

    case "exec":
      return (
        <div className="p-4">
          <ErrorBoundary>
            <ExecSection />
          </ErrorBoundary>
        </div>
      );

    default:
      return null;
  }
}

export default App;