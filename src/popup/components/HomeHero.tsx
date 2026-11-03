import { useState } from "react";
import { GithubIcon } from "./Icons";
import { loginWithGitHub } from "../../lib/github/auth";
import { getGitHubUser } from "../../lib/github/client";
import { setAuth } from "../../lib/storage/auth";
import {
  KeyRound,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import type { GitHubUser } from "../../lib/github/types";
import { useTheme } from "../hooks/useTheme";

interface HomeHeroProps {
  onSuccess: (user: GitHubUser) => void;
}

export function HomeHero({ onSuccess }: HomeHeroProps) {
  const [patToken, setPatToken] = useState("");
  const [patLoading, setPatLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOAuth, setShowOAuth] = useState(false);
  const { theme } = useTheme();
  const isDiwali = theme === "diwali";

  function openGitHubTokenPage() {
    const url =
      "https://github.com/settings/tokens/new?scopes=repo,read:user,notifications&description=Solohub%20Chrome%20Extension";
    if (typeof chrome !== "undefined" && chrome.tabs?.create) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  async function handlePatSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = patToken.trim();
    if (!token) return;

    try {
      setPatLoading(true);
      setError(null);

      const user = await getGitHubUser(token);
      await setAuth(token, user);
      onSuccess(user);
    } catch (err) {
      console.error("PAT verification failed:", err);
      setError(
        err instanceof Error
          ? `Authentication failed: ${err.message}`
          : "Invalid GitHub Personal Access Token."
      );
    } finally {
      setPatLoading(false);
    }
  }

  async function handleOAuthConnect() {
    try {
      setOauthLoading(true);
      setError(null);

      const token = await loginWithGitHub();
      const user = await getGitHubUser(token);
      await setAuth(token, user);
      onSuccess(user);
    } catch (err) {
      console.error("OAuth error:", err);
      const message =
        err instanceof Error ? err.message : "GitHub OAuth authentication failed";

      if (
        message.includes("VITE_BACKEND_URL") ||
        message.includes("VITE_GITHUB_CLIENT_ID") ||
        message.includes("Failed to fetch") ||
        message.includes("initialize authentication session")
      ) {
        setError(
          `OAuth is not configured: ${message}. For immediate, zero-configuration access, use a Personal Access Token above.`
        );
      } else {
        setError(message);
      }
    } finally {
      setOauthLoading(false);
    }
  }

  return (
    <div
      className={`relative flex h-full w-full flex-1 flex-col items-center justify-between px-6 py-6 text-center select-none transition-colors duration-200 overflow-y-auto no-scrollbar ${
        isDiwali
          ? "theme-diwali bg-[#0B090F]"
          : "bg-[#090A0F]"
      }`}
    >
      {/* Top Bar with Festive Theme Toggle */}
      <div className="flex w-full items-center justify-between">
        {isDiwali ? (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.2)]">
            <span className="text-xs">🪔</span>
            <span>Diwali Edition</span>
          </div>
        ) : (
          <span className="text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
            SoloHub v0.2.0
          </span>
        )}

        
      </div>

      {/* Main Content Area */}
      <div className="flex w-full max-w-xs flex-col items-center my-auto py-2">
        {/* SoloHub App Icon Badge with Diya Glow */}
        <div className="relative mb-3 flex items-center justify-center">
          <img
            src="/icons/icon-128.png"
            alt="SoloHub"
            className={`h-14 w-14 rounded-2xl object-cover transition-transform duration-200 hover:scale-105 ${
              isDiwali
                ? "shadow-[0_0_25px_rgba(245,158,11,0.35)] ring-1 ring-amber-500/40"
                : "shadow-2xl"
            }`}
          />
          {isDiwali && (
            <span className="absolute -top-1 -right-1 text-sm glow-diya-flame animate-diya">
              ✨
            </span>
          )}
        </div>

        {/* Title */}
        <h1
          className={`text-xl font-black tracking-wider ${
            isDiwali
              ? "bg-gradient-to-r from-amber-200 via-amber-300 to-yellow-400 bg-clip-text text-transparent"
              : "text-[#FAFAFA]"
          }`}
        >
          SOLOHUB
        </h1>

        {/* Tagline */}
        <p className="mt-1 text-xs leading-relaxed text-[#A1A1AA]">
          {isDiwali ? (
            <span className="text-amber-200/90 font-medium">
              A little light. A lot more productivity. 🪔
            </span>
          ) : (
            "GitHub productivity & control center for solo developers"
          )}
        </p>

        {/* Main Authentication Card */}
        <div className="mt-5 w-full space-y-3">
          {/* Primary Method: Personal Access Token (PAT-First) */}
          <form
            onSubmit={handlePatSubmit}
            className={`rounded-xl border p-3.5 text-left transition-colors space-y-3 ${
              isDiwali
                ? "border-amber-500/30 bg-[#0E0B12]/95 shadow-[0_0_20px_rgba(245,158,11,0.08)]"
                : "border-[#27272A] bg-[#0F0F11] shadow-lg"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#FAFAFA]">
                <KeyRound
                  size={13}
                  className={isDiwali ? "text-amber-400" : "text-[#FAFAFA]"}
                />
                <span>Personal Access Token</span>
              </div>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold border ${
                  isDiwali
                    ? "border-amber-500/40 bg-amber-500/15 text-amber-300"
                    : "border-emerald-800/40 bg-emerald-950/60 text-emerald-400"
                }`}
              >
                Recommended
              </span>
            </div>

            <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
              Direct GitHub API connection. Zero backend required.
            </p>

            <div className="space-y-1.5">
              <input
                id="pat-input"
                type="password"
                placeholder="ghp_... or github_pat_..."
                value={patToken}
                onChange={(e) => setPatToken(e.target.value)}
                disabled={patLoading || oauthLoading}
                className={`h-9 w-full rounded-lg border px-2.5 text-xs text-[#FAFAFA] placeholder-[#52525B] outline-none disabled:opacity-50 font-mono transition-colors ${
                  isDiwali
                    ? "border-amber-500/25 bg-[#09070D] focus:border-amber-500/60"
                    : "border-[#27272A] bg-[#090A0F] focus:border-[#3F3F46]"
                }`}
              />

              <div className="flex items-center justify-between pt-0.5 text-[10px]">
                <span className="text-[#71717A]">
                  Scopes: repo, read:user, notifications
                </span>
                <button
                  type="button"
                  onClick={openGitHubTokenPage}
                  className={`inline-flex items-center gap-1 transition-colors cursor-pointer ${
                    isDiwali
                      ? "text-amber-400 hover:text-amber-300"
                      : "text-emerald-400 hover:text-emerald-300"
                  }`}
                >
                  <span>Generate token</span>
                  <ExternalLink size={10} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={patLoading || oauthLoading || !patToken.trim()}
              className={`flex h-9 w-full items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold shadow-sm transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer ${
                isDiwali
                  ? "bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-zinc-950 font-bold hover:from-amber-300 hover:to-yellow-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                  : "bg-[#FAFAFA] text-[#090A0F] hover:bg-white"
              }`}
            >
              {patLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-950" />
                  <span>Verifying Token...</span>
                </>
              ) : (
                <>
                  {isDiwali && <Sparkles size={12} className="text-zinc-950" />}
                  <span>Connect Token</span>
                </>
              )}
            </button>
          </form>

          {/* Error Notice */}
          {error && (
            <div className="rounded-lg border border-red-900/50 bg-red-950/40 p-2.5 text-left text-xs text-red-300 leading-relaxed">
              {error}
            </div>
          )}

          {/* Optional Secondary Method: Self-Hosted OAuth */}
          <div
            className={`rounded-xl border p-3 text-left transition-colors ${
              isDiwali
                ? "border-amber-500/20 bg-[#0E0B12]/60"
                : "border-[#27272A]/70 bg-[#0F0F11]/60"
            }`}
          >
            <button
              type="button"
              onClick={() => setShowOAuth(!showOAuth)}
              className="flex w-full items-center justify-between text-xs font-medium text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <GithubIcon className="h-3.5 w-3.5" />
                <span>Self-Hosted OAuth</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-[#71717A]">
                <span>Advanced</span>
                {showOAuth ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </div>
            </button>

            {showOAuth && (
              <div className="mt-3 space-y-2.5 border-t border-[#27272A] pt-2.5 animate-in fade-in duration-150">
                <p className="text-[10px] text-[#71717A] leading-relaxed">
                  Requires self-hosting the Solohub token-exchange backend and registering a GitHub OAuth App matching your unpacked extension ID.
                </p>

                <button
                  type="button"
                  onClick={handleOAuthConnect}
                  disabled={oauthLoading || patLoading}
                  className="flex h-8 w-full items-center justify-center gap-2 rounded-lg border border-[#27272A] bg-[#18181B] px-3 text-xs font-medium text-[#FAFAFA] transition-colors hover:bg-[#27272A] disabled:opacity-50 cursor-pointer"
                >
                  {oauthLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Connecting OAuth...</span>
                    </>
                  ) : (
                    <>
                      <GithubIcon className="h-3.5 w-3.5" />
                      <span>Launch OAuth Flow</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="w-full text-center text-[10px] text-[#71717A] py-1">
        <span>Direct GitHub connection • Local encrypted sandboxed storage</span>
      </div>
    </div>
  );
}
