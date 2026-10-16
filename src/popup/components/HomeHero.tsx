import { useState } from "react";
import { GithubIcon } from "./Icons";
import { loginWithGitHub } from "../../lib/github/auth";
import { getGitHubUser } from "../../lib/github/client";
import { setAuth } from "../../lib/storage/auth";
import { KeyRound, Loader2, ExternalLink, ShieldAlert, ChevronDown, ChevronUp } from "lucide-react";
import type { GitHubUser } from "../../lib/github/types";

interface HomeHeroProps {
  onSuccess: (user: GitHubUser) => void;
}

export function HomeHero({ onSuccess }: HomeHeroProps) {
  const [patToken, setPatToken] = useState("");
  const [patLoading, setPatLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOAuth, setShowOAuth] = useState(false);

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
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 text-center select-none bg-[#090A0F]">
      {/* SoloHub App Icon Badge */}
      <div className="mb-4 flex items-center justify-center">
        <img
          src="/icons/icon-128.png"
          alt="SoloHub"
          className="h-14 w-14 rounded-2xl object-cover shadow-2xl transition-transform duration-200 hover:scale-105"
        />
      </div>

      {/* Title */}
      <h1 className="text-xl font-black tracking-wider text-[#FAFAFA]">
        SOLOHUB
      </h1>

      {/* Tagline */}
      <p className="mt-1.5 max-w-[300px] text-xs leading-relaxed text-[#A1A1AA]">
        GitHub productivity & control center for solo developers
      </p>

      {/* Main Authentication Card */}
      <div className="mt-6 w-full max-w-xs space-y-4">
        {/* Primary Method: Personal Access Token (PAT-First) */}
        <form
          onSubmit={handlePatSubmit}
          className="rounded-xl border border-[#27272A] bg-[#0F0F11] p-3.5 text-left shadow-lg space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#FAFAFA]">
              <KeyRound size={13} className="text-amber-400" />
              <span>Personal Access Token</span>
            </div>
            <span className="rounded bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
              Default
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
              className="h-9 w-full rounded-lg border border-[#27272A] bg-[#090A0F] px-2.5 text-xs text-[#FAFAFA] placeholder-[#52525B] outline-none focus:border-[#3F3F46] disabled:opacity-50 font-mono"
            />

            <div className="flex items-center justify-between pt-0.5 text-[10px]">
              <span className="text-[#71717A]">Scopes: repo, read:user, notifications</span>
              <button
                type="button"
                onClick={openGitHubTokenPage}
                className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
              >
                <span>Generate token</span>
                <ExternalLink size={10} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={patLoading || oauthLoading || !patToken.trim()}
            className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-[#FAFAFA] px-3 text-xs font-semibold text-[#090A0F] shadow-sm transition-colors hover:bg-white active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            {patLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#090A0F]" />
                <span>Verifying Token...</span>
              </>
            ) : (
              <span>Connect Token</span>
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
        <div className="rounded-xl border border-[#27272A]/70 bg-[#0F0F11]/60 p-3 text-left">
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

        {/* Security & Storage Disclosure */}
        <div className="flex items-start gap-1.5 text-left text-[10px] text-[#71717A] leading-tight px-1 pt-1">
          <ShieldAlert size={12} className="text-[#A1A1AA] shrink-0 mt-0.5" />
          <span>
            Tokens are stored locally in <code className="text-[#A1A1AA]">chrome.storage.local</code> without encryption. Do not connect on shared or public computers.
          </span>
        </div>
      </div>
    </div>
  );
}
