
import { TodayProductivity } from "../components/TodayProductivity";
import { ActionCenter } from "../components/ActionCenter";
import { ContributionHeatmap } from "../components/ContributionHeatmap";
import { ActivityFeed } from "../components/ActivityFeed";
import { ReleaseUpdateChecker } from "../components/ReleaseUpdateChecker";

import { ErrorBoundary } from "../components/ErrorBoundary";
import type { GitHubUser } from "../../lib/github/types";
import type { NavPage } from "../components/layout/BottomNav";
import {  ArrowRight } from "lucide-react";

interface HomePageProps {
  user: GitHubUser | null;
  onNavigate: (
    page: NavPage,
    state?: {
      repoAction?: "none" | "create-repo" | "manage-access";
    }
  ) => void;
}

export function HomePage({ user, onNavigate }: HomePageProps) {
  return (
    <div className="space-y-4">
      {/* 0. Solohub Release Update Notification (Conditional) */}
      <ErrorBoundary>
        <ReleaseUpdateChecker />
      </ErrorBoundary>

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

      {/* 3. Diwali Contribution Heatmap (Swapped above Action Center) */}
      <ErrorBoundary>
        <ContributionHeatmap />
      </ErrorBoundary>

      {/* 4. Action Center Preview (Max 2-3 items + View all →) */}
      <ErrorBoundary>
        <ActionCenter
          previewLimit={3}
          onViewAll={() => onNavigate("inbox")}
          showHeader={true}
        />
      </ErrorBoundary>

      {/* 5. Recent GitHub Activity Preview */}
      <ErrorBoundary>
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-[#FAFAFA]">
              Recent Activity
            </h2>
            <button
              type="button"
              onClick={() => onNavigate("inbox")}
              className="flex items-center gap-1 text-[11px] text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
            >
              <span>View full feed</span>
              <ArrowRight size={11} />
            </button>
          </div>
          <ActivityFeed limit={3} showHeader={false} compact={true} />
        </section>
      </ErrorBoundary>

     
    </div>
  );
}
