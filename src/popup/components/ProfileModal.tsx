import { X, LogOut, ExternalLink, ShieldCheck, User } from "lucide-react";
import type { GitHubUser } from "../../lib/github/types";
import { clearAuth } from "../../lib/storage/auth";
import { useQueryClient } from "@tanstack/react-query";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: GitHubUser | null;
  onLogout: () => void;
}

export function ProfileModal({
  isOpen,
  onClose,
  user,
  onLogout,
}: ProfileModalProps) {
  const queryClient = useQueryClient();

  if (!isOpen) return null;

  async function handleSignOut() {
    await clearAuth();
    queryClient.clear();
    onLogout();
    onClose();
  }

  function handleOpenGitHub(url?: string) {
    const targetUrl = url || (user ? `https://github.com/${user.login}` : "https://github.com");
    if (typeof chrome !== "undefined" && chrome.tabs?.create) {
      chrome.tabs.create({ url: targetUrl });
    } else {
      window.open(targetUrl, "_blank");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 p-4 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 className="text-sm font-semibold text-white">Developer Profile</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {user ? (
          <>
            {/* User Info Card */}
            <div className="flex items-center gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.login}
                  className="h-12 w-12 rounded-full border border-zinc-700 object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 text-white font-bold">
                  {user.login.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-white text-sm">
                  {user.name || user.login}
                </p>
                <p className="truncate text-xs text-zinc-400">@{user.login}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-zinc-400">Connected via SoloHub</span>
                </div>
              </div>
            </div>

            {/* Quick Status Cards */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-2.5 text-center">
                <div className="flex items-center justify-center gap-1.5 text-zinc-400">
                  <ShieldCheck size={13} className="text-emerald-400" />
                  <span className="text-[11px]">Account ID</span>
                </div>
                <p className="mt-1 text-xs font-mono font-semibold text-zinc-200">
                  #{user.id}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-2.5 text-center">
                <div className="flex items-center justify-center gap-1.5 text-zinc-400">
                  <User size={13} className="text-zinc-400" />
                  <span className="text-[11px]">Role</span>
                </div>
                <p className="mt-1 text-xs font-semibold text-zinc-200">
                  Solo Developer
                </p>
              </div>
            </div>

            {/* Open Profile Button */}
            <button
              type="button"
              onClick={() => handleOpenGitHub(user.html_url)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-zinc-800 active:scale-[0.99]"
            >
              <span>View GitHub Profile</span>
              <ExternalLink size={13} className="text-zinc-400" />
            </button>
          </>
        ) : (
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 text-center">
            <p className="text-xs text-zinc-400">Not connected to GitHub</p>
          </div>
        )}

        {/* Sign Out Button */}
        {user && (
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-900/50 bg-red-950/20 px-4 py-2.5 text-xs font-semibold text-red-300 transition hover:bg-red-950/50 active:scale-[0.99]"
          >
            <LogOut size={14} />
            <span>Sign Out from SoloHub</span>
          </button>
        )}
      </div>
    </div>
  );
}
