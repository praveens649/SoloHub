import { ActionCenter } from "./ActionCenter";
import { Zap } from "lucide-react";

export function InboxSection() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-500">Real-time Signals</p>
          <h2 className="text-lg font-semibold text-white flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-amber-400 fill-amber-400/20" />
            Developer Inbox
          </h2>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3">
        <p className="text-xs text-zinc-400">
          Showing pull requests, issues, and action items requiring your immediate attention.
        </p>
      </div>

      <ActionCenter />
    </div>
  );
}
