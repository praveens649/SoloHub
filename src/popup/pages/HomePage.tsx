import { TodayProductivity } from "../components/TodayProductivity";
import { ActionCenter } from "../components/ActionCenter";
import { ContributionHeatmap } from "../components/ContributionHeatmap";
import { ActivityFeed } from "../components/ActivityFeed";
import { ReleaseUpdateChecker } from "../components/ReleaseUpdateChecker";
import { ErrorBoundary } from "../components/ErrorBoundary";
import type { GitHubUser } from "../../lib/github/types";
import type { NavPage } from "../components/layout/BottomNav";
import { ArrowRight } from "lucide-react";
import { useTheme } from "../hooks/useTheme";

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
  const { theme } = useTheme();
  const isDiwali = theme === "diwali";

  return (
    <div className="space-y-4">
      {/* 0. Solohub Release Update Notification (Conditional) */}
      <ErrorBoundary>
        <ReleaseUpdateChecker />
      </ErrorBoundary>

      {/* 1. Compact Welcome / Status Card */}
      <div
        className={`flex items-center justify-between rounded-lg border px-3.5 py-2.5 transition-colors ${
          isDiwali
            ? "border-amber-500/30 bg-gradient-to-r from-[#170E08] via-[#100D15] to-[#0E0A12] shadow-[0_0_15px_rgba(245,158,11,0.06)]"
            : "border-[#27272A] bg-[#0F0F11]"
        }`}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-xs font-semibold text-[#FAFAFA]">
              Welcome back, @{user?.login || "developer"}
            </p>
            {isDiwali && (
              <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-amber-300">
                🪔 Diwali Edition
              </span>
            )}
          </div>
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
