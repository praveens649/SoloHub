import { AlertTriangle, Clock, RefreshCw, WifiOff } from "lucide-react";
import { GitHubApiError, GitHubNetworkError } from "../../lib/github/errors";

interface GitHubRateLimitMessageProps {
  error: unknown;
  onRetry?: () => void;
  className?: string;
}

export function GitHubRateLimitMessage({
  error,
  onRetry,
  className = "",
}: GitHubRateLimitMessageProps) {
  if (!error) return null;

  const isRateLimit =
    error instanceof GitHubApiError && error.isRateLimit;
  const isNetwork =
    error instanceof GitHubNetworkError ||
    (error instanceof Error &&
      (error.message.toLowerCase().includes("network") ||
        error.message.toLowerCase().includes("failed to fetch")));

  if (isRateLimit) {
    const apiError = error as GitHubApiError;
    const resetTime = apiError.getFormattedResetTime();

    return (
      <div
        className={`rounded-lg border border-amber-900/60 bg-amber-950/30 p-3 text-amber-200 ${className}`}
        role="alert"
      >
        <div className="flex items-start gap-2.5">
          <Clock size={16} className="mt-0.5 shrink-0 text-amber-400" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-amber-300">
              GitHub API rate limit reached
            </p>
            <p className="mt-0.5 text-[11px] text-amber-400/90">
              {resetTime
                ? `Limit will reset around ${resetTime}. Solohub is pausing requests to protect your account.`
                : "Limit temporarily exceeded. Please try again in a few minutes."}
            </p>

            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-2 inline-flex items-center gap-1 rounded bg-amber-900/60 px-2 py-1 text-[10px] font-medium text-amber-100 transition hover:bg-amber-800"
              >
                <RefreshCw size={10} />
                <span>Retry</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isNetwork) {
    return (
      <div
        className={`rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-zinc-300 ${className}`}
        role="alert"
      >
        <div className="flex items-start gap-2.5">
          <WifiOff size={16} className="mt-0.5 shrink-0 text-zinc-400" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-zinc-200">
              Unable to reach GitHub
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-400">
              Please check your internet connection or GitHub status.
            </p>

            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-2 inline-flex items-center gap-1 rounded bg-zinc-800 px-2 py-1 text-[10px] font-medium text-zinc-200 transition hover:bg-zinc-700"
              >
                <RefreshCw size={10} />
                <span>Retry</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Generic clean error
  const message =
    error instanceof Error ? error.message : "An unexpected error occurred.";

  return (
    <div
      className={`rounded-lg border border-red-900/50 bg-red-950/20 p-3 text-red-300 ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-400" />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-red-300">{message}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 inline-flex items-center gap-1 rounded bg-red-900/40 px-2 py-1 text-[10px] font-medium text-red-200 transition hover:bg-red-900/70"
            >
              <RefreshCw size={10} />
              <span>Retry</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
