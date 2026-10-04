import { useState } from "react";
import { TerminalBadgeIcon, GithubIcon } from "./Icons";
import { loginWithGitHub } from "../../lib/github/auth";
import { getGitHubUser } from "../../lib/github/client";
import { setAuth } from "../../lib/storage/auth";
import { KeyRound, Loader2 } from "lucide-react";
import type { GitHubUser } from "../../lib/github/types";

interface HomeHeroProps {
  onSuccess: (user: GitHubUser) => void;
}

export function HomeHero({ onSuccess }: HomeHeroProps) {
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
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center select-none bg-[#090A0F]">
      {/* Terminal Icon Badge */}
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#27272A] bg-[#0F0F11] shadow-lg">
        <TerminalBadgeIcon className="h-7 w-7 text-[#FAFAFA]" />
      </div>

      {/* Title */}
      <h1 className="text-xl font-black tracking-wider text-[#FAFAFA]">
        SOLOHUB
      </h1>

      {/* Tagline */}
      <p className="mt-2 max-w-[280px] text-xs leading-relaxed text-[#A1A1AA]">
        GitHub productivity & control center for solo developers
      </p>

      {/* Action CTA */}
      <div className="mt-8 w-full max-w-xs space-y-3">
        <button
          type="button"
          onClick={handleOAuthConnect}
          disabled={loading}
          className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl bg-[#FAFAFA] px-4 text-xs font-semibold text-[#090A0F] shadow-sm transition-colors hover:bg-white active:scale-[0.99] disabled:opacity-60 cursor-pointer"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-[#090A0F]" />
          ) : (
            <GithubIcon className="h-4 w-4 text-[#090A0F]" />
          )}
          <span>{loading ? "Connecting..." : "Connect with GitHub"}</span>
        </button>

        {/* Permissions Subtext */}
        <p className="text-[11px] text-[#71717A]">
          Requires read/write repo permissions
        </p>

        {/* Optional PAT input toggle */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowPatInput(!showPatInput)}
            className="inline-flex items-center gap-1 text-[11px] text-[#71717A] transition-colors hover:text-[#A1A1AA] cursor-pointer"
          >
            <KeyRound size={12} />
            <span>{showPatInput ? "Hide token input" : "Personal Access Token"}</span>
          </button>
        </div>

        {showPatInput && (
          <form
            onSubmit={handlePatSubmit}
            className="mt-2 space-y-2 rounded-lg border border-[#27272A] bg-[#0F0F11] p-3 text-left"
          >
            <label
              htmlFor="pat-input"
              className="block text-[11px] font-medium text-[#A1A1AA]"
            >
              Personal Access Token:
            </label>
            <input
              id="pat-input"
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={patToken}
              onChange={(e) => setPatToken(e.target.value)}
              className="h-8 w-full rounded-md border border-[#27272A] bg-[#090A0F] px-2.5 text-xs text-[#FAFAFA] placeholder-[#71717A] outline-none focus:border-[#3F3F46]"
            />
            <button
              type="submit"
              disabled={patLoading || !patToken.trim()}
              className="h-8 w-full rounded-md bg-[#18181B] text-xs font-medium text-[#FAFAFA] transition-colors hover:bg-[#27272A] disabled:opacity-50 cursor-pointer"
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
    </div>
  );
}
