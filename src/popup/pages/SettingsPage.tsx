import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Moon,
  RefreshCw,
  Check,
  LogOut,
  Shield,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import type { GitHubUser } from "../../lib/github/types";
import { useQueryClient } from "@tanstack/react-query";
import {
  getUserPreferences,
  setHeatmapPalettePreference,
  type HeatmapPalettePreference,
} from "../../lib/storage/preferences";
import { useReleaseUpdate } from "../hooks/useReleaseUpdate";

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
  const [palette, setPalette] = useState<HeatmapPalettePreference>("diwali");

  const queryClient = useQueryClient();
  const {
    installedVersion,
    latestVersion,
    hasUpdate,
    release,
    isChecking,
    checkForUpdates,
  } = useReleaseUpdate();

  useEffect(() => {
    async function load() {
      const prefs = await getUserPreferences();
      setPalette(prefs.heatmapPalette);
    }
    void load();
  }, []);

  async function handlePaletteChange(newPalette: HeatmapPalettePreference) {
    setPalette(newPalette);
    await setHeatmapPalettePreference(newPalette);
  }

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
          <div className="border-t border-[#27272A]/80 pt-2 flex items-center justify-between text-[11px] text-[#71717A]">
            <span>Authentication: Direct GitHub API (PAT / OAuth)</span>
            <button
              type="button"
              onClick={() => {
                const url = "https://github.com/settings/tokens";
                if (typeof chrome !== "undefined" && chrome.tabs?.create) {
                  chrome.tabs.create({ url });
                } else {
                  window.open(url, "_blank", "noopener,noreferrer");
                }
              }}
              className="text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
            >
              Manage Tokens ↗
            </button>
          </div>
        </div>
      </section>

      {/* 2. Preferences */}
      <section className="space-y-2">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#71717A]">
          Preferences
        </h2>

        <div className="rounded-lg border border-[#27272A] bg-[#0F0F11] p-3 space-y-3">
          {/* Theme */}
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

          {/* Seasonal Contribution Palette */}
          <div className="border-t border-[#27272A]/80 pt-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-amber-400" />
              <div>
                <p className="text-xs font-medium text-[#FAFAFA]">
                  Contribution Heatmap Palette
                </p>
                <p className="text-[10px] text-[#71717A]">
                  Seasonal saffron & gold or classic obsidian emerald
                </p>
              </div>
            </div>

            <div className="flex rounded-md border border-[#27272A] bg-[#18181B] p-0.5">
              <button
                type="button"
                onClick={() => handlePaletteChange("diwali")}
                className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors cursor-pointer ${
                  palette === "diwali"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                🪔 Diwali
              </button>
              <button
                type="button"
                onClick={() => handlePaletteChange("classic")}
                className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors cursor-pointer ${
                  palette === "classic"
                    ? "bg-zinc-800 text-white border border-zinc-700"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Classic
              </button>
            </div>
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

      {/* 4. About & Releases */}
      <section className="space-y-2">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#71717A]">
          About & Releases
        </h2>

        <div className="rounded-lg border border-[#27272A] bg-[#0F0F11] p-3 text-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src="/icons/icon-32.png"
                alt="SoloHub"
                className="h-4 w-4 rounded object-contain"
              />
              <span className="text-[#FAFAFA] font-medium">Solohub</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[#71717A]">v{installedVersion}</span>
              <button
                type="button"
                onClick={() => void checkForUpdates(true)}
                disabled={isChecking}
                className="flex items-center gap-1 rounded border border-[#27272A] bg-[#18181B] px-2 py-0.5 text-[10px] font-medium text-zinc-300 hover:text-white disabled:opacity-50 cursor-pointer transition-colors"
              >
                <RefreshCw size={10} className={isChecking ? "animate-spin" : ""} />
                <span>Check for updates</span>
              </button>
            </div>
          </div>

          {/* Update Status Banner in Settings */}
          {hasUpdate && release && (
            <div className="rounded-md border border-amber-500/30 bg-amber-950/20 p-2 text-[11px] flex items-center justify-between">
              <div>
                <span className="font-semibold text-amber-300">
                  Update {latestVersion} is available!
                </span>
                <p className="text-[10px] text-zinc-400">
                  Solohub Diwali Update with new features.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const url = release.html_url;
                  if (typeof chrome !== "undefined" && chrome.tabs?.create) {
                    chrome.tabs.create({ url });
                  } else {
                    window.open(url, "_blank", "noopener,noreferrer");
                  }
                }}
                className="flex items-center gap-1 rounded bg-amber-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-amber-500 transition-colors cursor-pointer"
              >
                <span>View Release</span>
                <ExternalLink size={10} />
              </button>
            </div>
          )}

          <p className="text-[11px] text-[#71717A] leading-relaxed">
            GitHub productivity & control center for solo developers.
          </p>
          <div className="pt-1 flex items-start gap-1.5 text-[10px] text-[#71717A] leading-tight">
            <Shield size={11} className="text-[#A1A1AA] mt-0.5 shrink-0" />
            <span>
              Tokens are stored locally in unencrypted browser storage. Disconnect if using a shared or public computer.
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
