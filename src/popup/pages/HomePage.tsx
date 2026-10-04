import { useState } from "react";
import { TodayProductivity } from "../components/TodayProductivity";
import { ActionCenter } from "../components/ActionCenter";
import { WeeklyActivity } from "../components/WeeklyActivity";
import { NewIssueForm } from "../components/NewIssueForm";
import { ErrorBoundary } from "../components/ErrorBoundary";
import type { GitHubUser } from "../../lib/github/types";
import type { NavPage } from "../components/layout/BottomNav";
import { FolderPlus, CircleDot, Users, X } from "lucide-react";

interface HomePageProps {
  user: GitHubUser | null;
  onNavigate: (page: NavPage, state?: { execMode?: "none" | "create-repo" | "manage-access" }) => void;
  onOpenNewIssue?: () => void;
}

export function HomePage({ user, onNavigate, onOpenNewIssue }: HomePageProps) {
  const [showIssueModal, setShowIssueModal] = useState(false);

  function handleCreateIssueClick() {
    if (onOpenNewIssue) {
      onOpenNewIssue();
    } else {
      setShowIssueModal(true);
    }
  }

  return (
    <div className="space-y-4">
      {/* 1. Compact Welcome / Status Card */}
      <div className="flex items-center justify-between rounded-lg border border-[#27272A] bg-[#0F0F11] px-3.5 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-[#FAFAFA]">
            Welcome back, @{user?.login || "developer"}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#A1A1AA]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>GitHub connected</span>
          </div>
        </div>
      </div>

      {/* 2. Today's Productivity */}
      <ErrorBoundary>
        <TodayProductivity />
      </ErrorBoundary>

      {/* 3. Action Center Preview (Max 2-3 items + View all →) */}
      <ErrorBoundary>
        <ActionCenter
          previewLimit={3}
          onViewAll={() => onNavigate("inbox")}
          showHeader={true}
        />
      </ErrorBoundary>

      {/* 4. Weekly Activity */}
      <ErrorBoundary>
        <WeeklyActivity />
      </ErrorBoundary>

      {/* 5. Quick Shortcuts */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold text-[#FAFAFA]">
          Quick Shortcuts
        </h2>

        <div className="grid grid-cols-3 gap-2">
          {/* Create Repository */}
          <button
            type="button"
            onClick={() => onNavigate("exec", { execMode: "create-repo" })}
            className="flex flex-col items-center justify-center rounded-lg border border-[#27272A] bg-[#0F0F11] p-2.5 text-center transition-colors hover:border-[#3F3F46] hover:bg-[#18181B] cursor-pointer"
          >
            <FolderPlus size={15} className="text-[#A1A1AA]" />
            <span className="mt-1.5 text-[11px] font-medium text-[#FAFAFA] leading-tight">
              Create Repo
            </span>
          </button>

          {/* Create Issue */}
          <button
            type="button"
            onClick={handleCreateIssueClick}
            className="flex flex-col items-center justify-center rounded-lg border border-[#27272A] bg-[#0F0F11] p-2.5 text-center transition-colors hover:border-[#3F3F46] hover:bg-[#18181B] cursor-pointer"
          >
            <CircleDot size={15} className="text-[#A1A1AA]" />
            <span className="mt-1.5 text-[11px] font-medium text-[#FAFAFA] leading-tight">
              Create Issue
            </span>
          </button>

          {/* Manage Access */}
          <button
            type="button"
            onClick={() => onNavigate("exec", { execMode: "manage-access" })}
            className="flex flex-col items-center justify-center rounded-lg border border-[#27272A] bg-[#0F0F11] p-2.5 text-center transition-colors hover:border-[#3F3F46] hover:bg-[#18181B] cursor-pointer"
          >
            <Users size={15} className="text-[#A1A1AA]" />
            <span className="mt-1.5 text-[11px] font-medium text-[#FAFAFA] leading-tight">
              Manage Access
            </span>
          </button>
        </div>
      </section>

      {/* Quick Create Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="w-full max-w-sm rounded-xl border border-[#27272A] bg-[#0F0F11] p-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#27272A] pb-2 mb-3">
              <h3 className="text-xs font-semibold text-white">Create GitHub Issue</h3>
              <button
                type="button"
                onClick={() => setShowIssueModal(false)}
                className="rounded p-1 text-[#71717A] hover:bg-[#18181B] hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
            <NewIssueForm onClose={() => setShowIssueModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
