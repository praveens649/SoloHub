import { useState } from "react";
import { ArrowLeft, Moon, RefreshCw, Check, LogOut, Shield } from "lucide-react";
import type { GitHubUser } from "../../lib/github/types";
import { useQueryClient } from "@tanstack/react-query";

interface SettingsPageProps {
  user: GitHubUser | null;
  onBack: () => void;
  onDisconnect: () => void;
}

export function SettingsPage({
  user,
  onBack,
  onDisconnect,
}: SettingsPageProps) {
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const queryClient = useQueryClient();

  async function handleSyncCache() {
    setSyncing(true);
    await queryClient.invalidateQueries();
    setSyncing(false);
    setSyncDone(true);
    setTimeout(() => setSyncDone(false), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Header with Back button */}
      <div className="flex items-center gap-2 border-b border-[#27272A] pb-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-[#27272A] bg-[#0F0F11] text-[#A1A1AA] transition-colors hover:bg-[#18181B] hover:text-[#FAFAFA] cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft size={14} />
        </button>
        <div>
          <h1 className="text-sm font-bold text-[#FAFAFA]">Settings</h1>
        </div>
      </div>

      {/* 1. GitHub Account */}
      <section className="space-y-2">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#71717A]">
          GitHub Account
        </h2>

        <div className="rounded-lg border border-[#27272A] bg-[#0F0F11] p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.login}
                  className="h-8 w-8 rounded-full border border-[#27272A]"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#18181B] text-xs font-bold text-white">
                  {user?.login?.slice(0, 2).toUpperCase() || "SH"}
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-[#FAFAFA]">
                  @{user?.login || "connected"}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Connected</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onDisconnect}
              className="flex items-center gap-1 rounded-md border border-red-900/60 bg-red-950/30 px-2.5 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-900/50 hover:text-red-200 cursor-pointer"
            >
              <LogOut size={12} />
              <span>Disconnect</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Preferences */}
      <section className="space-y-2">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#71717A]">
          Preferences
        </h2>

        <div className="rounded-lg border border-[#27272A] bg-[#0F0F11] p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon size={15} className="text-[#A1A1AA]" />
              <div>
                <p className="text-xs font-medium text-[#FAFAFA]">Theme</p>
                <p className="text-[10px] text-[#71717A]">Developer Dark Obsidian</p>
              </div>
            </div>

            <span className="rounded bg-[#18181B] border border-[#27272A] px-2 py-0.5 text-[10px] font-semibold text-[#A1A1AA]">
              Active
            </span>
          </div>
        </div>
      </section>

      {/* 3. GitHub API */}
      <section className="space-y-2">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#71717A]">
          GitHub API & Cache
        </h2>

        <div className="rounded-lg border border-[#27272A] bg-[#0F0F11] p-3 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#A1A1AA]">Cache Invalidation</span>
            <button
              type="button"
              onClick={handleSyncCache}
              disabled={syncing}
              className="flex items-center gap-1 rounded-md border border-[#27272A] bg-[#090A0F] px-2.5 py-1 text-xs text-[#FAFAFA] transition-colors hover:bg-[#18181B] disabled:opacity-50 cursor-pointer"
            >
              {syncDone ? (
                <>
                  <Check size={12} className="text-emerald-400" />
                  <span className="text-emerald-400">Synced</span>
                </>
              ) : (
                <>
                  <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
                  <span>Sync Now</span>
                </>
              )}
            </button>
          </div>

          <p className="text-[10px] text-[#71717A] leading-relaxed">
            Forces a live sync across pull requests, repositories, issues, and activity data.
          </p>
        </div>
      </section>

      {/* 4. About */}
      <section className="space-y-2">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#71717A]">
          About
        </h2>

        <div className="rounded-lg border border-[#27272A] bg-[#0F0F11] p-3 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src="/icons/icon-32.png"
                alt="SoloHub"
                className="h-4 w-4 rounded object-contain"
              />
              <span className="text-[#FAFAFA] font-medium">Solohub</span>
            </div>
            <span className="font-mono text-[#71717A]">v0.1.0</span>
          </div>
          <p className="text-[11px] text-[#71717A] leading-relaxed">
            GitHub productivity & control center for solo developers.
          </p>
          <div className="pt-1 flex items-center gap-1 text-[10px] text-[#71717A]">
            <Shield size={11} className="text-emerald-400" />
            <span>Tokens are stored securely. So chill out!😘</span>
          </div>
        </div>
      </section>
    </div>
  );
}
