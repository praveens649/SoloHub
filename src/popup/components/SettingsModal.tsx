import { useState } from "react";
import { X, Moon, KeyRound, Shield, RefreshCw, Check, AlertCircle } from "lucide-react";
import { setAuth } from "../../lib/storage/auth";
import { getGitHubUser } from "../../lib/github/client";
import { useQueryClient } from "@tanstack/react-query";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthChanged: () => void;
}

export function SettingsModal({ isOpen, onClose, onAuthChanged }: SettingsModalProps) {
  const [tokenInput, setTokenInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const queryClient = useQueryClient();

  if (!isOpen) return null;

  async function handleSaveToken(e: React.FormEvent) {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    try {
      setLoading(true);
      setFeedback(null);

      const user = await getGitHubUser(tokenInput.trim());
      await setAuth(tokenInput.trim(), user);
      
      setFeedback({ type: "success", text: `Authenticated as @${user.login}!` });
      queryClient.invalidateQueries();
      onAuthChanged();
      setTokenInput("");
    } catch (err) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to validate token",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleResetCache() {
    queryClient.invalidateQueries();
    setFeedback({ type: "success", text: "Cache invalidated and data refreshed!" });
    setTimeout(() => setFeedback(null), 2500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 p-4 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            <h3 className="text-sm font-semibold text-white">SoloHub Settings</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Theme Status */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon size={16} className="text-zinc-300" />
              <div>
                <p className="text-xs font-medium text-white">Theme</p>
                <p className="text-[11px] text-zinc-400">Developer Dark Obsidian</p>
              </div>
            </div>
            <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
              Active
            </span>
          </div>
        </div>

        {/* Update / Change Token */}
        <form onSubmit={handleSaveToken} className="space-y-2 rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-white">
            <KeyRound size={14} className="text-zinc-400" />
            <span>Update Personal Access Token</span>
          </div>
          <p className="text-[11px] text-zinc-400">
            Paste a new GitHub PAT (with repo & read:user scopes) to reconnect or switch accounts.
          </p>
          <input
            type="password"
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !tokenInput.trim()}
            className="w-full rounded-lg bg-zinc-800 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-50"
          >
            {loading ? "Validating..." : "Apply New Token"}
          </button>
        </form>

        {/* Cache & Sync */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-white">Refresh Data Cache</p>
            <p className="text-[11px] text-zinc-400">Force sync PRs, issues and productivity</p>
          </div>
          <button
            type="button"
            onClick={handleResetCache}
            className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-200 transition hover:bg-zinc-700 active:scale-95"
          >
            <RefreshCw size={12} />
            <span>Sync</span>
          </button>
        </div>

        {/* Feedback message */}
        {feedback && (
          <div
            className={`flex items-center gap-2 rounded-lg p-2.5 text-xs ${
              feedback.type === "success"
                ? "border border-emerald-900/60 bg-emerald-950/40 text-emerald-300"
                : "border border-red-900/60 bg-red-950/40 text-red-300"
            }`}
          >
            {feedback.type === "success" ? <Check size={14} /> : <AlertCircle size={14} />}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Footer info */}
        <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-400">
          <span>SoloHub v0.1.0</span>
          <span className="flex items-center gap-1">
            <Shield size={11} /> Secure local storage
          </span>
        </div>
      </div>
    </div>
  );
}
