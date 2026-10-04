import { useState } from "react";
import { QuickActions, type QuickActionMode } from "../components/QuickActions";
import { Copy, Check } from "lucide-react";

interface ExecPageProps {
  initialMode?: QuickActionMode;
}

export function ExecPage({ initialMode = "none" }: ExecPageProps) {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const cliCommands = [
    {
      title: "Check PR Status",
      cmd: "gh pr status",
    },
    {
      title: "List Open Issues",
      cmd: "gh issue list --limit 10",
    },
    {
      title: "Fetch & Rebase Main",
      cmd: "git fetch origin && git rebase origin/main",
    },
    {
      title: "Create Feature Branch",
      cmd: "git checkout -b feature/your-feature",
    },
    {
      title: "Discard Local Changes",
      cmd: "git restore .",
    },
  ];

  async function handleCopy(cmd: string) {
    try {
      await navigator.clipboard.writeText(cmd);
      setCopiedCmd(cmd);
      setTimeout(() => setCopiedCmd(null), 1800);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div>
        <p className="text-[11px] text-[#71717A]">Developer Control</p>
        <h1 className="text-base font-bold text-[#FAFAFA]">Execution Center</h1>
      </div>

      {/* Quick Actions (Create Repo, Manage Access) */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold text-[#FAFAFA]">Quick Actions</h2>
        <QuickActions initialMode={initialMode} />
      </section>

      {/* CLI Quick Commands */}
      <section className="space-y-2 pt-1">
        <div>
          <h2 className="text-xs font-semibold text-[#FAFAFA]">
            CLI Quick Commands
          </h2>
          <p className="text-[11px] text-[#71717A]">
            Copyable GitHub and Git CLI commands for your terminal
          </p>
        </div>

        <div className="space-y-2">
          {cliCommands.map((item) => (
            <div
              key={item.cmd}
              className="flex items-center justify-between rounded-lg border border-[#27272A] bg-[#0F0F11] p-2.5 transition-colors hover:border-[#3F3F46]"
            >
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-[11px] font-medium text-[#FAFAFA]">
                  {item.title}
                </p>
                <code className="mt-0.5 block truncate font-mono text-[11px] text-emerald-400">
                  $ {item.cmd}
                </code>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(item.cmd)}
                title="Copy command to clipboard"
                className="flex h-7 items-center justify-center gap-1 rounded-md border border-[#27272A] bg-[#090A0F] px-2 text-[10px] text-[#A1A1AA] transition-colors hover:bg-[#18181B] hover:text-[#FAFAFA] cursor-pointer"
              >
                {copiedCmd === item.cmd ? (
                  <>
                    <Check size={11} className="text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={11} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
