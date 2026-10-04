import { useState } from "react";
import { TerminalBadgeIcon, GithubIcon } from "./Icons";
import { loginWithGitHub } from "../../lib/github/auth";
import { getGitHubUser } from "../../lib/github/client";
import { setAuth } from "../../lib/storage/auth";
import { KeyRound, Loader2, ArrowRight } from "lucide-react";
import type { GitHubUser } from "../../lib/github/types";

interface HomeHeroProps {
  onSuccess: (user: GitHubUser) => void;
  authenticated?: boolean;
  username?: string | null;
  onExploreDashboard?: () => void;
}

export function HomeHero({
  onSuccess,
  authenticated = false,
  username = null,
  onExploreDashboard,
}: HomeHeroProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPatInput, setShowPatInput] = useState(false);
  const [patToken, setPatToken] = useState("");
  const [patLoading, setPatLoading] = useState(false);

  async function handleOAuthConnect() {
    try {
      setLoading(true);
      setError(null);

      const token = await loginWithGitHub();
      const user = await getGitHubUser(token);
      await setAuth(token, user);
      onSuccess(user);
    } catch (err) {
      console.error("OAuth error:", err);
      const message =
        err instanceof Error ? err.message : "GitHub authentication failed";
      
      // If backend is not reached or chrome identity fails, provide helpful hint
      if (
        message.includes("Failed to exchange") ||
        message.includes("Failed to fetch") ||
        message.includes("launchWebAuthFlow")
      ) {
        setError(
          `${message}. Tip: You can also use a Personal Access Token below for instant access.`
        );
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handlePatSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patToken.trim()) return;

    try {
      setPatLoading(true);
      setError(null);

      const user = await getGitHubUser(patToken.trim());
      await setAuth(patToken.trim(), user);
      onSuccess(user);
    } catch (err) {
      console.error("PAT verification failed:", err);
      setError(
        err instanceof Error
          ? `Invalid token: ${err.message}`
          : "Invalid GitHub Personal Access Token."
      );
    } finally {
      setPatLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center select-none">
      {/* Background subtle radial glow */}
      <div className="pointer-events-none absolute inset-x-0 top-1/4 -z-10 flex justify-center">
        <div className="h-44 w-72 rounded-full bg-zinc-800/30 blur-3xl" />
      </div>

      {/* Terminal Icon Badge */}
      <div className="group relative mb-5">
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-b from-white/10 to-zinc-800/20 blur-md transition duration-300 group-hover:from-white/20" />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 shadow-xl transition-transform duration-300 group-hover:scale-105">
          <TerminalBadgeIcon className="h-7 w-7 text-white" />
        </div>
      </div>

      {/* Title */}
      <h1 className="text-xl font-black tracking-wider text-white">
        SOLOHUB
      </h1>

      {/* Tagline / Subtitle */}
      <p className="mt-2 max-w-[280px] text-sm leading-relaxed text-zinc-400">
        GitHub productivity & control center for solo developers
      </p>

      {/* If already authenticated, show status banner */}
      {authenticated && (
        <div className="mt-6 w-full max-w-xs rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-left">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <p className="text-xs font-medium text-white">Connected as @{username}</p>
                <p className="text-[11px] text-zinc-400">Live sync active</p>
              </div>
            </div>
            {onExploreDashboard && (
              <button
                type="button"
                onClick={onExploreDashboard}
                className="flex items-center gap-1 rounded-lg bg-zinc-800 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-700 active:scale-95"
              >
                Dashboard <ArrowRight size={12} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Action CTA */}
      {!authenticated && (
        <div className="mt-8 w-full max-w-xs space-y-3">
          <button
            type="button"
            onClick={handleOAuthConnect}
            disabled={loading}
            className="group relative flex w-full items-center justify-center gap-2.5 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-zinc-950 shadow-md transition-all duration-200 hover:bg-zinc-100 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-zinc-900" />
            ) : (
              <GithubIcon className="h-4.5 w-4.5 text-zinc-950 transition-transform duration-200 group-hover:scale-110" />
            )}
            <span>{loading ? "Connecting..." : "Connect with GitHub"}</span>
          </button>

          {/* Subtitle / Permission notice */}
          <p className="text-xs text-zinc-400">
            Requires read/write repo permissions
          </p>

          {/* Fallback / Developer PAT Toggle */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowPatInput(!showPatInput)}
              className="inline-flex items-center gap-1 text-[11px] text-zinc-400 transition hover:text-zinc-200 underline-offset-4 hover:underline"
            >
              <KeyRound size={12} />
              <span>{showPatInput ? "Hide token input" : "Or use Personal Access Token"}</span>
            </button>
          </div>

          {showPatInput && (
            <form onSubmit={handlePatSubmit} className="mt-2 space-y-2 rounded-xl border border-zinc-800/80 bg-zinc-900/80 p-3 text-left">
              <label htmlFor="pat-input" className="block text-[11px] font-medium text-zinc-300">
                Personal Access Token (classic or fine-grained):
              </label>
              <input
                id="pat-input"
                type="password"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                value={patToken}
                onChange={(e) => setPatToken(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-xs text-white placeholder-zinc-400 focus:border-zinc-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={patLoading || !patToken.trim()}
                className="w-full rounded-lg bg-zinc-800 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-50"
              >
                {patLoading ? "Validating..." : "Save and Authenticate"}
              </button>
            </form>
          )}

          {error && (
            <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-2.5 text-left text-xs text-red-300">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
