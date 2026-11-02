import { useState, useRef, useEffect } from "react";
import { Search, Settings, User as UserIcon, LogOut } from "lucide-react";
import type { GitHubUser } from "../../../lib/github/types";
import { useTheme } from "../../hooks/useTheme";

interface HeaderProps {
  user: GitHubUser | null;
  onOpenSearch: () => void;
  onNavigateSettings: () => void;
  onDisconnect: () => void;
}

export function Header({
  user,
  onOpenSearch,
  onNavigateSettings,
  onDisconnect,
}: HeaderProps) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();
  const isDiwali = theme === "diwali";

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }

    if (profileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [profileMenuOpen]);

  return (
    <header
      className={`relative z-30 flex h-14 w-full shrink-0 items-center justify-between border-b px-4 transition-colors duration-200 ${
        isDiwali
          ? "border-amber-500/20 bg-[#0e0a12]/95 shadow-[0_4px_16px_rgba(245,158,11,0.04)]"
          : "border-[#27272A] bg-[#09090B]"
      }`}
    >
      {/* Brand Title */}
      <div className="flex items-center gap-2 select-none">
        <img
          src="/icons/icon-32.png"
          alt="SoloHub"
          className="h-5 w-5 rounded object-contain"
        />
        <div className="flex items-center gap-1.5">
          <span
            className={`text-sm font-black tracking-wider ${
              isDiwali
                ? "bg-gradient-to-r from-amber-200 via-amber-300 to-yellow-400 bg-clip-text text-transparent"
                : "text-[#FAFAFA]"
            }`}
          >
            SOLOHUB
          </span>
          {isDiwali && (
            <span
              className="text-xs glow-diya-flame animate-diya"
              title="Diwali Edition"
            >
              🪔
            </span>
          )}
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-1">
        {/* Quick Diwali Theme Toggle Pill */}
        <button
          type="button"
          onClick={() => void toggleTheme()}
          title={
            isDiwali
              ? "Diwali Theme Active (Click for Classic Dark)"
              : "Switch to Festive Diwali Theme"
          }
          className={`mr-1 flex h-6.5 items-center gap-1 rounded-full px-2 text-[10px] font-semibold transition-colors cursor-pointer border ${
            isDiwali
              ? "border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 shadow-[0_0_8px_rgba(245,158,11,0.2)]"
              : "border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
          }`}
          aria-label="Toggle theme"
        >
          <span className="text-[11px]">{isDiwali ? "🪔" : "🌙"}</span>
          <span className="leading-none">{isDiwali ? "Diwali" : "Dark"}</span>
        </button>

        {/* Search button with Ctrl+K shortcut */}
        <button
          type="button"
          onClick={onOpenSearch}
          title="Search (Ctrl+K / ⌘K)"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#A1A1AA] transition-colors hover:bg-[#18181B] hover:text-[#FAFAFA] active:scale-95 cursor-pointer"
          aria-label="Search"
        >
          <Search size={16} strokeWidth={2} />
        </button>

        {/* Settings button */}
        <button
          type="button"
          onClick={onNavigateSettings}
          title="Settings"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#A1A1AA] transition-colors hover:bg-[#18181B] hover:text-[#FAFAFA] active:scale-95 cursor-pointer"
          aria-label="Settings"
        >
          <Settings size={16} strokeWidth={2} />
        </button>

        {/* Profile Avatar / Menu Trigger */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setProfileMenuOpen((prev) => !prev)}
            title={user ? `@${user.login}` : "Account"}
            className="flex h-8 w-8 items-center justify-center rounded-lg p-0.5 text-[#A1A1AA] transition-colors hover:bg-[#18181B] hover:text-[#FAFAFA] active:scale-95 cursor-pointer"
            aria-label="Account Profile"
            aria-expanded={profileMenuOpen}
          >
            {user?.avatar_url ? (
              <div className="relative">
                <img
                  src={user.avatar_url}
                  alt={user.login}
                  className="h-6 w-6 rounded-full border border-[#27272A] object-cover"
                />
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-[#09090B] bg-emerald-500" />
              </div>
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[#27272A] bg-[#0F0F11] text-[#A1A1AA]">
                <UserIcon size={13} />
              </div>
            )}
          </button>

          {/* Compact Profile Menu Dropdown */}
          {profileMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl border border-[#27272A] bg-[#0F0F11] p-2.5 shadow-xl animate-in fade-in zoom-in-95 duration-100 z-50">
              <div className="flex items-center gap-2.5 border-b border-[#27272A] pb-2.5 mb-2 px-1">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.login}
                    className="h-7 w-7 rounded-full border border-[#27272A]"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#18181B] text-xs font-bold text-white">
                    {user?.login?.slice(0, 2).toUpperCase() || "SH"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-[#FAFAFA]">
                    @{user?.login || "anonymous"}
                  </p>
                  <p className="flex items-center gap-1.5 text-[10px] text-[#A1A1AA]">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Connected
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(false);
                  onDisconnect();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-950/40 hover:text-red-300 cursor-pointer"
              >
                <LogOut size={13} />
                <span>Disconnect</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
