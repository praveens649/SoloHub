import { AlertCircle, RefreshCw } from "lucide-react";
import { formatGitHubError } from "../../../lib/github/errors";

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  className?: string;
  fallbackMessage?: string;
}

export function ErrorState({
  error,
  onRetry,
  className = "",
  fallbackMessage = "Unable to load data.",
}: ErrorStateProps) {
  if (!error) return null;

  const friendlyMessage = formatGitHubError(error, fallbackMessage);

  return (
    <div
      role="alert"
      className={`rounded-lg border border-red-900/60 bg-[#0F0F11] p-3 text-xs text-[#FAFAFA] space-y-2 ${className}`}
    >
      <div className="flex items-start gap-2">
        <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
        <p className="min-w-0 flex-1 text-xs text-red-200 leading-snug break-words">
          {friendlyMessage}
        </p>
      </div>

      {onRetry && (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1.5 rounded-md border border-[#27272A] bg-[#18181B] px-2.5 py-1 text-xs font-medium text-[#FAFAFA] transition-colors hover:bg-[#27272A] cursor-pointer"
          >
            <RefreshCw size={11} />
            <span>Retry</span>
          </button>
        </div>
      )}
    </div>
  );
}
