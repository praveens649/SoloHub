import type { ReactNode } from "react";
import { Header } from "./Header";
import { BottomNav, type NavPage } from "./BottomNav";
import type { GitHubUser } from "../../../lib/github/types";

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
  return (
    <div className="relative flex h-[600px] w-full min-w-[380px] max-w-[420px] mx-auto flex-col overflow-hidden bg-[#090A0F] text-[#FAFAFA] font-sans antialiased">
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
