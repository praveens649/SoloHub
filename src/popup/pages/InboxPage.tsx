import { useState } from "react";
import { ActionCenter } from "../components/ActionCenter";
import { ActivityFeed } from "../components/ActivityFeed";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { Zap, Activity } from "lucide-react";

export function InboxPage() {
  const [activeTab, setActiveTab] = useState<"actionable" | "activity">("actionable");

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-base font-bold text-[#FAFAFA]">
          Developer Inbox
        </h1>
        <p className="text-xs text-[#71717A]">
          Actionable pull requests, issues, and real-time account activity
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex rounded-lg border border-[#27272A] bg-[#0F0F11] p-0.5">
        <button
          type="button"
          onClick={() => setActiveTab("actionable")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors cursor-pointer ${
            activeTab === "actionable"
              ? "bg-[#27272A] text-white shadow-xs"
              : "text-[#71717A] hover:text-[#FAFAFA]"
          }`}
        >
          <Zap size={13} />
          <span>Action Required</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("activity")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors cursor-pointer ${
            activeTab === "activity"
              ? "bg-[#27272A] text-white shadow-xs"
              : "text-[#71717A] hover:text-[#FAFAFA]"
          }`}
        >
          <Activity size={13} />
          <span>Activity Feed</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "actionable" ? (
        <ErrorBoundary>
          <ActionCenter showHeader={false} />
        </ErrorBoundary>
      ) : (
        <ErrorBoundary>
          <ActivityFeed showHeader={true} />
        </ErrorBoundary>
      )}
    </div>
  );
}
