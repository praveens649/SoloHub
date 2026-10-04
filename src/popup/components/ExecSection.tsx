import { useState } from "react";
import { QuickActions } from "./QuickActions";
import { ExecNavIcon } from "./Icons";
import { Terminal, Copy, Check, ExternalLink } from "lucide-react";

export function ExecSection() {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const quickCommands = [
    { label: "Check PR Status", cmd: "gh pr status" },
    { label: "List Open Issues", cmd: "gh issue list --limit 10" },
    { label: "Fetch & Rebase Main", cmd: "git fetch origin && git rebase origin/main" },
    { label: "Create Feature Branch", cmd: "git checkout -b feature/solohub-enhancement" },
    { label: "Undo Last Commit (Keep Changes)", cmd: "git reset --soft HEAD~1" },
    { label: "View Pretty Git Log", cmd: "git log --oneline --graph --decorate -n 10" },
  ];

  function handleCopy(cmd: string) {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 1800);
  }

  function handleOpenUrl(url: string) {
    if (typeof chrome !== "undefined" && chrome.tabs?.create) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, "_blank");
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs text-zinc-500">Developer Control</p>
        <h2 className="text-lg font-semibold text-white flex items-center gap-1.5">
          <ExecNavIcon className="h-4 w-4 text-emerald-400" />
          Execution Center
        </h2>
      </div>

      {/* Embedded QuickActions for creating repo and collaborator management */}
      <QuickActions />

      {/* Terminal Command Runner / Cheatsheet */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3.5 backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal size={15} className="text-zinc-400" />
            <h3 className="text-xs font-semibold text-white">CLI Quick Runner</h3>
          </div>
          <span className="text-[10px] text-zinc-400 font-mono">Terminal / gh</span>
        </div>

        <div className="space-y-2">
          {quickCommands.map((item) => (
            <div
              key={item.cmd}
              className="flex items-center justify-between rounded-lg border border-zinc-800/60 bg-zinc-950/70 px-2.5 py-2"
            >
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-[11px] font-medium text-zinc-300">{item.label}</p>
                <code className="block truncate text-[11px] font-mono text-emerald-400/90">
                  $ {item.cmd}
                </code>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(item.cmd)}
                title="Copy command"
                className="rounded p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
              >
                {copiedCmd === item.cmd ? (
                  <Check size={13} className="text-emerald-400" />
                ) : (
                  <Copy size={13} />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Developer Links */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3">
        <p className="mb-2 text-[11px] font-medium text-zinc-400">Quick Developer Portals</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleOpenUrl("https://github.com/settings/tokens")}
            className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/60 px-2.5 py-2 text-left text-xs text-zinc-300 transition hover:border-zinc-700 hover:text-white"
          >
            <span>GitHub Tokens</span>
            <ExternalLink size={12} className="text-zinc-400" />
          </button>
          <button
            type="button"
            onClick={() => handleOpenUrl("https://github.com/settings/keys")}
            className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/60 px-2.5 py-2 text-left text-xs text-zinc-300 transition hover:border-zinc-700 hover:text-white"
          >
            <span>SSH / GPG Keys</span>
            <ExternalLink size={12} className="text-zinc-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
