import { useState } from "react";
import { ExternalLink, X, ChevronDown, ChevronUp } from "lucide-react";
import { useReleaseUpdate } from "../hooks/useReleaseUpdate";

interface ReleaseUpdateCheckerProps {
  onDismissed?: () => void;
}

export function ReleaseUpdateChecker({
  onDismissed,
}: ReleaseUpdateCheckerProps) {
  const {
    hasUpdate,
    latestVersion,
    release,
    isDismissed,
    isLoading,
    dismiss,
    postpone,
  } = useReleaseUpdate();

  const [expandedNotes, setExpandedNotes] = useState(false);

  if (isLoading || !hasUpdate || isDismissed || !release) {
    return null;
  }

  function handleOpenReleaseNotes() {
    const url = release?.html_url || "https://github.com/praveens649/SoloHub/releases";
    if (typeof chrome !== "undefined" && chrome.tabs?.create) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  async function handleDismiss() {
    await dismiss();
    if (onDismissed) onDismissed();
  }

  async function handlePostpone() {
    await postpone(24);
    if (onDismissed) onDismissed();
  }

  return (
    <div
      role="region"
      aria-label="New Release Update"
      className="relative overflow-hidden rounded-xl border border-amber-500/40 bg-gradient-to-b from-[#1A140B] via-[#120F0B] to-[#0A0A0C] p-3.5 shadow-xl shadow-amber-950/20 animate-in fade-in slide-in-from-top-2 duration-200"
    >
      {/* Decorative Warm Festive Ambient Glow */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-amber-500/15 blur-2xl" />
      <div className="pointer-events-none absolute -left-8 -bottom-8 h-24 w-24 rounded-full bg-orange-600/10 blur-xl" />

      {/* Header Row: Title, Festive Diya & Quick Dismiss Button */}
      <div className="relative flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/15 text-sm shadow-[0_0_10px_rgba(245,158,11,0.25)]">
            🪔
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Solohub {latestVersion || "v0.2.0"}
              </span>
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.2 text-[9px] font-medium text-amber-300">
                Update Available
              </span>
            </div>
            <h3 className="text-xs font-bold text-white leading-tight mt-0.5">
              The Solohub Diwali Update is here!
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          title="Dismiss this update announcement"
          className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>

      {/* Seasonal Diwali Message Body */}
      <div className="relative mt-2.5 space-y-1.5 text-xs text-zinc-300 leading-relaxed border-t border-amber-500/20 pt-2.5">
        <p className="font-medium text-amber-200/90 italic">
          "A little light. A lot more productivity. 🪔"
        </p>

        <p className="text-[11px] text-zinc-300">
          Celebrate the festival of lights with a fresh contribution chart, a new
          GitHub activity feed, and a smoother way to stay updated.
        </p>

        <p className="text-[11px] text-zinc-400">
          Your GitHub workflow just got brighter. <br />
          <strong className="text-amber-300/90 font-medium">Happy Diwali from Solohub.</strong>
        </p>
      </div>

      {/* Release Notes Preview Accordion */}
      {release.body && (
        <div className="relative mt-2 rounded-md border border-zinc-800 bg-black/40 p-2 text-[11px]">
          <button
            type="button"
            onClick={() => setExpandedNotes((prev) => !prev)}
            className="flex w-full items-center justify-between text-left font-medium text-zinc-300 hover:text-white cursor-pointer"
          >
            <span>What's new in {release.name || latestVersion}</span>
            {expandedNotes ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {expandedNotes && (
            <div className="mt-1.5 max-h-32 overflow-y-auto whitespace-pre-wrap text-[10px] text-zinc-400 border-t border-zinc-800/80 pt-1.5">
              {release.body}
            </div>
          )}
        </div>
      )}

      {/* Developer Mode Manual Update Notice */}
      <div className="relative mt-2.5 rounded border border-amber-900/40 bg-amber-950/20 px-2 py-1 text-[10px] text-amber-300/90 leading-tight">
        <span>💡 <strong>Extension Notice:</strong> Chrome extensions in Developer Mode must be updated manually. Download the release ZIP, unzip, and click Reload on chrome://extensions.</span>
      </div>

      {/* Action Buttons */}
      <div className="relative mt-3 flex items-center justify-between gap-2 pt-1 border-t border-amber-500/20">
        <button
          type="button"
          onClick={handlePostpone}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white cursor-pointer"
        >
          Later
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDismiss}
            className="text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            Dismiss
          </button>

          <button
            type="button"
            onClick={handleOpenReleaseNotes}
            className="flex items-center gap-1 rounded-md border border-amber-500/60 bg-gradient-to-r from-amber-600 to-orange-600 px-3 py-1 text-[11px] font-semibold text-white shadow-sm hover:from-amber-500 hover:to-orange-500 cursor-pointer transition-all"
          >
            <span>View Release Notes</span>
            <ExternalLink size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}
