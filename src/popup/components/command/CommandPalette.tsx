import { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  House,
  Zap,
  GitPullRequest,
  FolderGit2,
  Terminal,
  FolderPlus,
  CirclePlus,
  Users,
  Settings,
  X,
  CornerDownLeft,
} from "lucide-react";
import type { NavPage } from "../layout/BottomNav";

export type CommandGroup = "Navigation" | "Actions" | "Repository" | "Settings";

export interface Command {
  id: string;
  label: string;
  description?: string;
  group: CommandGroup;
  keywords?: string[];
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (
    page: NavPage,
    state?: { execMode?: "none" | "create-repo" | "manage-access"; focusSearch?: boolean }
  ) => void;
  onOpenNewIssue: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onNavigate,
  onOpenNewIssue,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  // Platform detection for shortcut hints
  const isMac =
    typeof navigator !== "undefined" &&
    navigator.userAgent.toLowerCase().includes("mac");
  const shortcutModifier = isMac ? "⌘" : "Ctrl+";

  // Define commands
  const commands: Command[] = useMemo(
    () => [
      // Navigation
      {
        id: "nav-home",
        label: "Home",
        description: "Overview & productivity dashboard",
        group: "Navigation",
        keywords: ["home", "dashboard", "overview", "stats", "today"],
        icon: House,
        action: () => onNavigate("home"),
      },
      {
        id: "nav-inbox",
        label: "Inbox",
        description: "Actionable pull requests & issues",
        group: "Navigation",
        keywords: ["inbox", "notifications", "alerts", "reviews", "signals"],
        icon: Zap,
        action: () => onNavigate("inbox"),
      },
      {
        id: "nav-prs",
        label: "Pull Requests",
        description: "Reviews, merges & PR status",
        group: "Navigation",
        keywords: ["prs", "pull", "requests", "reviews", "merge"],
        icon: GitPullRequest,
        action: () => onNavigate("prs"),
      },
      {
        id: "nav-repos",
        label: "Repositories",
        description: "View and filter your repositories",
        group: "Navigation",
        keywords: ["repos", "repositories", "projects", "code", "starred"],
        icon: FolderGit2,
        action: () => onNavigate("repos"),
      },
      {
        id: "nav-exec",
        label: "Execution Center",
        description: "Quick developer actions & CLI commands",
        group: "Navigation",
        keywords: ["exec", "execution", "terminal", "cli", "commands", "runner"],
        icon: Terminal,
        action: () => onNavigate("exec"),
      },

      // Actions
      {
        id: "act-create-repo",
        label: "Create Repository",
        description: "Create a new GitHub repository",
        group: "Actions",
        keywords: ["create", "new", "repo", "repository", "init"],
        icon: FolderPlus,
        action: () => onNavigate("exec", { execMode: "create-repo" }),
      },
      {
        id: "act-create-issue",
        label: "Create Issue",
        description: "Create a task or bug report",
        group: "Actions",
        keywords: ["create", "new", "issue", "bug", "task"],
        icon: CirclePlus,
        action: () => onOpenNewIssue(),
      },
      {
        id: "act-manage-access",
        label: "Manage Access",
        description: "Add or remove collaborators",
        group: "Actions",
        keywords: ["access", "collaborators", "team", "invite", "permissions"],
        icon: Users,
        action: () => onNavigate("exec", { execMode: "manage-access" }),
      },

      // Repository
      {
        id: "repo-search",
        label: "Search Repositories",
        description: "Quick jump & filter repositories",
        group: "Repository",
        keywords: ["search", "find", "filter", "repos", "repositories"],
        icon: Search,
        shortcut: `${shortcutModifier}K`,
        action: () => onNavigate("repos", { focusSearch: true }),
      },

      // Settings
      {
        id: "settings-open",
        label: "Open Settings",
        description: "Account, theme & cache preferences",
        group: "Settings",
        keywords: ["settings", "preferences", "config", "account", "theme", "disconnect"],
        icon: Settings,
        action: () => onNavigate("settings"),
      },
    ],
    [onNavigate, onOpenNewIssue, shortcutModifier]
  );

  // Filter commands by query
  const filteredCommands = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;

    return commands.filter((cmd) => {
      const matchLabel = cmd.label.toLowerCase().includes(q);
      const matchGroup = cmd.group.toLowerCase().includes(q);
      const matchDesc = cmd.description?.toLowerCase().includes(q);
      const matchKeywords = cmd.keywords?.some((k) => k.toLowerCase().includes(q));

      return matchLabel || matchGroup || matchDesc || matchKeywords;
    });
  }, [commands, query]);

  // Keep selected index within bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Group the filtered commands for rendering
  const groupedCommands = useMemo(() => {
    const groups: { [key in CommandGroup]?: Command[] } = {};
    for (const cmd of filteredCommands) {
      if (!groups[cmd.group]) {
        groups[cmd.group] = [];
      }
      groups[cmd.group]!.push(cmd);
    }
    return groups;
  }, [filteredCommands]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement | null;
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 20);
    } else {
      if (previouslyFocusedElement.current && typeof previouslyFocusedElement.current.focus === "function") {
        previouslyFocusedElement.current.focus();
      }
    }
  }, [isOpen]);

  // Keyboard navigation inside palette
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        const selected = filteredCommands[selectedIndex];
        if (selected) {
          executeCommand(selected);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeElement = listRef.current.querySelector(
        `[data-command-index="${selectedIndex}"]`
      );
      if (activeElement && typeof activeElement.scrollIntoView === "function") {
        activeElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  function executeCommand(cmd: Command) {
    onClose();
    cmd.action();
  }

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 p-3.5 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[340px] mt-6 rounded-xl border border-[#27272A] bg-[#0F0F11] shadow-2xl overflow-hidden transition-all transform duration-150 scale-100"
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-[#27272A] px-3 bg-[#090A0F]">
          <Search size={15} className="text-[#71717A] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-autocomplete="list"
            aria-label="Search or run a command"
            placeholder="Search or run a command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full bg-transparent pl-2.5 pr-8 text-xs text-[#FAFAFA] placeholder-[#71717A] outline-none"
          />

          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-[#71717A] hover:text-[#FAFAFA] cursor-pointer"
            >
              <X size={13} />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block rounded border border-[#27272A] bg-[#18181B] px-1.5 py-0.5 text-[9px] font-mono text-[#71717A]">
              ESC
            </kbd>
          )}
        </div>

        {/* Commands List */}
        <div
          ref={listRef}
          role="listbox"
          aria-label="Commands"
          className="max-h-[300px] overflow-y-auto p-1.5 divide-y divide-[#27272A]/40"
        >
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#71717A]">
              No commands found.
            </div>
          ) : (
            (
              Object.entries(groupedCommands) as [
                CommandGroup,
                Command[]
              ][]
            ).map(([groupName, items]) => {
              if (!items || items.length === 0) return null;

              return (
                <div key={groupName} className="py-1 first:pt-0.5 last:pb-0.5">
                  <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#71717A]">
                    {groupName}
                  </p>

                  <div className="space-y-0.5">
                    {items.map((cmd) => {
                      const overallIndex = filteredCommands.findIndex(
                        (c) => c.id === cmd.id
                      );
                      const isSelected = overallIndex === selectedIndex;
                      const Icon = cmd.icon;

                      return (
                        <div
                          key={cmd.id}
                          role="option"
                          aria-selected={isSelected}
                          data-command-index={overallIndex}
                          onMouseEnter={() => setSelectedIndex(overallIndex)}
                          onClick={() => executeCommand(cmd)}
                          className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors cursor-pointer select-none ${
                            isSelected
                              ? "bg-[#18181B] text-[#FAFAFA] border border-[#27272A]"
                              : "text-[#A1A1AA] hover:bg-[#18181B]/70 hover:text-[#FAFAFA] border border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon
                              size={14}
                              strokeWidth={isSelected ? 2.2 : 1.8}
                              className={`shrink-0 ${
                                isSelected ? "text-[#FAFAFA]" : "text-[#71717A]"
                              }`}
                            />
                            <div className="min-w-0">
                              <span className="truncate font-medium text-xs">
                                {cmd.label}
                              </span>
                              {cmd.description && (
                                <p className="truncate text-[10px] text-[#71717A]">
                                  {cmd.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 pl-2 shrink-0">
                            {cmd.shortcut && (
                              <span className="rounded bg-[#090A0F] border border-[#27272A] px-1 py-0.5 text-[9px] font-mono text-[#71717A]">
                                {cmd.shortcut}
                              </span>
                            )}

                            {isSelected && (
                              <CornerDownLeft
                                size={11}
                                className="text-[#71717A]"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="flex items-center justify-between border-t border-[#27272A] bg-[#090A0F] px-3 py-1.5 text-[10px] text-[#71717A]">
          <div className="flex items-center gap-2">
            <span>
              <kbd className="font-mono">↑↓</kbd> navigate
            </span>
            <span>
              <kbd className="font-mono">↵</kbd> select
            </span>
            <span>
              <kbd className="font-mono">esc</kbd> close
            </span>
          </div>
          <span>Solohub</span>
        </div>
      </div>
    </div>
  );
}
