import { House, Zap, GitPullRequest, FolderGit2, Terminal } from "lucide-react";

export type NavPage = "home" | "inbox" | "prs" | "repos" | "exec" | "settings";

interface BottomNavProps {
  currentPage: NavPage;
  onSelectPage: (page: NavPage) => void;
  inboxCount?: number;
  prsCount?: number;
}

export function BottomNav({
  currentPage,
  onSelectPage,
  inboxCount = 0,
  prsCount = 0,
}: BottomNavProps) {
  const tabs = [
    {
      id: "home" as const,
      label: "Home",
      icon: House,
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
      icon: GitPullRequest,
      badge: prsCount,
    },
    {
      id: "repos" as const,
      label: "Repos",
      icon: FolderGit2,
      badge: 0,
    },
    {
      id: "exec" as const,
      label: "Exec",
      icon: Terminal,
      badge: 0,
    },
  ];

  return (
    <nav className="sticky bottom-0 z-30 flex h-14 w-full shrink-0 items-center justify-around border-t border-[#27272A] bg-[#09090B] px-1 select-none">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentPage === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectPage(tab.id)}
            className={`group relative flex flex-1 flex-col items-center justify-center py-1 transition-colors duration-150 cursor-pointer ${
              isActive ? "text-[#FAFAFA]" : "text-[#71717A] hover:text-[#A1A1AA]"
            }`}
          >
            {/* Small active indicator at top */}
            {isActive && (
              <span className="absolute -top-[1px] h-0.5 w-6 rounded-full bg-[#FAFAFA]" />
            )}

            <div className="relative flex items-center justify-center">
              <Icon
                size={18}
                strokeWidth={isActive ? 2.2 : 1.7}
                className="transition-transform duration-150"
              />

              {/* Display badge only when meaningful data > 0 */}
              {tab.badge > 0 && (
                <span className="absolute -right-2.5 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-zinc-950">
                  {tab.badge > 9 ? "9+" : tab.badge}
                </span>
              )}
            </div>

            <span
              className={`mt-1 text-[10px] font-medium leading-tight ${
                isActive ? "text-[#FAFAFA] font-semibold" : "text-[#71717A] group-hover:text-[#A1A1AA]"
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
