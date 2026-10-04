import { Home, Zap } from "lucide-react";
import { SortPrsIcon, ReposNavIcon, ExecNavIcon } from "./Icons";

export type NavTab = "home" | "inbox" | "prs" | "repos" | "exec";

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  inboxCount?: number;
  prsCount?: number;
}

export function BottomNav({
  currentTab,
  onSelectTab,
  inboxCount = 0,
  prsCount = 0,
}: BottomNavProps) {
  const tabs = [
    {
      id: "home" as const,
      label: "Home",
      icon: Home,
      badge: 0,
    },
    {
      id: "inbox" as const,
      label: "Inbox",
      icon: Zap,
      badge: inboxCount,
    },
    {
      id: "prs" as const,
      label: "PRs",
      icon: SortPrsIcon,
      badge: prsCount,
    },
    {
      id: "repos" as const,
      label: "Repos",
      icon: ReposNavIcon,
      badge: 0,
    },
    {
      id: "exec" as const,
      label: "Exec",
      icon: ExecNavIcon,
      badge: 0,
    },
  ];

  return (
    <nav className="sticky bottom-0 z-30 flex items-center justify-around border-t border-zinc-800/80 bg-zinc-950/90 py-1.5 px-2 backdrop-blur-md">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            className={`group relative flex flex-1 flex-col items-center justify-center py-1 transition-all duration-200 ${
              isActive
                ? "text-white scale-105"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {/* Active glow / accent bar at top */}
            {isActive && (
              <span className="absolute -top-1.5 h-0.5 w-6 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
            )}

            <div className="relative flex items-center justify-center">
              <Icon className={`h-5 w-5 transition-transform duration-200 ${isActive ? "stroke-[2.2]" : "stroke-[1.7]"}`} />

              {tab.badge > 0 && (
                <span className="absolute -right-2 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-black">
                  {tab.badge > 9 ? "9+" : tab.badge}
                </span>
              )}
            </div>

            <span
              className={`mt-1 text-[11px] font-medium transition-colors ${
                isActive ? "text-white font-semibold" : "text-zinc-500 group-hover:text-zinc-300"
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
