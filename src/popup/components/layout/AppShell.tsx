import type { ReactNode } from "react";
import { Header } from "./Header";
import { BottomNav, type NavPage } from "./BottomNav";
import type { GitHubUser } from "../../../lib/github/types";
import { useTheme } from "../../hooks/useTheme";

interface AppShellProps {
  user: GitHubUser | null;
  currentPage: NavPage;
  onSelectPage: (page: NavPage) => void;
  onOpenSearch: () => void;
  onDisconnect: () => void;
  inboxCount?: number;
  prsCount?: number;
  children: ReactNode;
}

export function AppShell({
  user,
  currentPage,
  onSelectPage,
  onOpenSearch,
  onDisconnect,
  inboxCount = 0,
  prsCount = 0,
  children,
}: AppShellProps) {
  const { theme } = useTheme();
  const isDiwali = theme === "diwali";

  return (
    <div
      className={`relative flex h-[600px] w-[420px] flex-col overflow-hidden text-[#FAFAFA] font-sans antialiased transition-colors duration-200 ${
        isDiwali
          ? "theme-diwali bg-[#0B090F]"
          : "bg-[#090A0F]"
      }`}
    >
      {/* Sticky Header */}
      <Header
        user={user}
        onOpenSearch={onOpenSearch}
        onNavigateSettings={() => onSelectPage("settings")}
        onDisconnect={onDisconnect}
      />

      {/* Vertically scrollable main content, no nested scroll containers */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 space-y-4">
        {children}
      </main>

      {/* Sticky Bottom Navigation */}
      <BottomNav
        currentPage={currentPage}
        onSelectPage={onSelectPage}
        inboxCount={inboxCount}
        prsCount={prsCount}
      />
    </div>
  );
}
