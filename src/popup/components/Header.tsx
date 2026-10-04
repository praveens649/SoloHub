import { Search, Settings, User as UserIcon } from "lucide-react";
import type { GitHubUser } from "../../lib/github/types";

interface HeaderProps {
  user?: GitHubUser | null;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
}

export function Header({
  user,
  onOpenSearch,
  onOpenSettings,
  onOpenProfile,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950/80 px-4 py-3 backdrop-blur-md">
      <div className="flex items-center gap-2 select-none">
        <img
          src="/icons/icon-32.png"
          alt="SoloHub"
          className="h-5 w-5 rounded object-contain"
        />
        <span className="text-base font-extrabold tracking-wider text-white">
          SOLOHUB
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onOpenSearch}
          title="Search (Ctrl+K)"
          className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-800/60 hover:text-white active:scale-95"
          aria-label="Search"
        >
          <Search size={18} strokeWidth={2} />
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          title="Settings"
          className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-800/60 hover:text-white active:scale-95"
          aria-label="Settings"
        >
          <Settings size={18} strokeWidth={2} />
        </button>

        <button
          type="button"
          onClick={onOpenProfile}
          title={user ? `@${user.login}` : "Profile"}
          className="relative rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-800/60 hover:text-white active:scale-95"
          aria-label="Profile"
        >
          {user?.avatar_url ? (
            <div className="relative">
              <img
                src={user.avatar_url}
                alt={user.login}
                className="h-6 w-6 rounded-full border border-zinc-700 object-cover"
              />
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-zinc-950 bg-emerald-500" />
            </div>
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-700/60 bg-zinc-900 text-zinc-300">
              <UserIcon size={14} />
            </div>
          )}
        </button>
      </div>
    </header>
  );
}
