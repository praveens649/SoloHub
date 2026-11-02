import { useState } from "react";
import {
  Tag,
  FolderGit2,
  Star,
  GitFork,
  GitPullRequest,
  CircleDot,
  GitCommit,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Inbox,
  Users,
  User,
} from "lucide-react";
import { useActivityFeed, type FeedSource } from "../hooks/useActivityFeed";
import { GitHubRateLimitMessage } from "./GitHubRateLimitMessage";
import {
  filterActivityItems,
  type ActivityCategory,
  type ActivityItem,
} from "../../lib/github/activity";

interface ActivityFeedProps {
  initialCategory?: ActivityCategory;
  initialSource?: FeedSource;
  limit?: number;
  showHeader?: boolean;
  compact?: boolean;
}

function getFeedBadgeIcon(type: ActivityItem["type"]) {
  switch (type) {
    case "release":
      return <Tag size={9} className="text-white" />;
    case "repo_created":
      return <FolderGit2 size={9} className="text-white" />;
    case "star":
      return <Star size={9} className="text-amber-300" />;
    case "fork":
      return <GitFork size={9} className="text-white" />;
    case "pr":
      return <GitPullRequest size={9} className="text-indigo-300" />;
    case "issue":
      return <CircleDot size={9} className="text-emerald-300" />;
    case "commit":
      return <GitCommit size={9} className="text-blue-300" />;
    default:
      return <FolderGit2 size={9} className="text-white" />;
  }
}

function getBadgeBg(type: ActivityItem["type"]) {
  switch (type) {
    case "release":
    case "repo_created":
      return "bg-emerald-600 border-emerald-500";
    case "star":
      return "bg-amber-600 border-amber-500";
    case "fork":
      return "bg-purple-600 border-purple-500";
    case "pr":
      return "bg-indigo-600 border-indigo-500";
    case "issue":
      return "bg-emerald-600 border-emerald-500";
    case "commit":
      return "bg-blue-600 border-blue-500";
    default:
      return "bg-zinc-700 border-zinc-600";
  }
}

export function ActivityFeed({
  initialCategory = "all",
  initialSource = "following",
  limit,
  showHeader = true,
  compact = false,
}: ActivityFeedProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<ActivityCategory>(initialCategory);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {}
  );

  const {
    data: allItems,
    isLoading,
    isError,
    error,
    isFetching,
    feedSource,
    setFeedSource,
    refetch,
    refresh,
  } = useActivityFeed(initialSource);

  const categories: Array<{ id: ActivityCategory; label: string }> = [
    { id: "all", label: "All" },
    { id: "releases", label: "Releases" },
    { id: "repos", label: "Repos" },
    { id: "prs", label: "PRs" },
    { id: "issues", label: "Issues" },
    { id: "commits", label: "Commits" },
  ];

  function openLink(url: string) {
    if (typeof chrome !== "undefined" && chrome.tabs?.create) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  function toggleExpand(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  if (isLoading && !allItems) {
    return (
      <div className="space-y-3">
        {showHeader && (
          <div className="flex items-center justify-between pb-1">
            <div className="h-4 w-28 animate-pulse rounded bg-zinc-800" />
            <div className="h-4 w-16 animate-pulse rounded bg-zinc-800" />
          </div>
        )}
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="rounded-xl border border-[#30363d] bg-[#0d1117] p-3.5 space-y-2.5"
            >
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 animate-pulse rounded-full bg-zinc-800" />
                <div className="h-3 w-40 animate-pulse rounded bg-zinc-800" />
              </div>
              <div className="h-16 rounded-lg bg-zinc-800/60 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError && !allItems) {
    return (
      <GitHubRateLimitMessage
        error={error}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  const items = filterActivityItems(allItems || [], selectedCategory);
  const displayItems = limit ? items.slice(0, limit) : items;

  return (
    <section className="space-y-3">
      {/* Feed Header matching GitHub Feed style */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white tracking-tight">
              Feed
            </h2>

            {/* Source Switcher: Following vs You */}
            <div className="flex rounded-md border border-[#30363d] bg-[#161b22] p-0.5">
              <button
                type="button"
                onClick={() => setFeedSource("following")}
                className={`flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium transition-colors cursor-pointer ${
                  feedSource === "following"
                    ? "bg-[#21262d] text-white shadow-xs"
                    : "text-[#8b949e] hover:text-[#c9d1d9]"
                }`}
              >
                <Users size={11} />
                <span>Following</span>
              </button>
              <button
                type="button"
                onClick={() => setFeedSource("personal")}
                className={`flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium transition-colors cursor-pointer ${
                  feedSource === "personal"
                    ? "bg-[#21262d] text-white shadow-xs"
                    : "text-[#8b949e] hover:text-[#c9d1d9]"
                }`}
              >
                <User size={11} />
                <span>You</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void refresh()}
            disabled={isFetching}
            title="Refresh feed"
            className="flex items-center gap-1 rounded p-1 text-xs text-[#8b949e] hover:bg-[#21262d] hover:text-white disabled:opacity-50 cursor-pointer transition-colors"
          >
            <RefreshCw size={12} className={isFetching ? "animate-spin" : ""} />
            <span className="text-[10px]">Refresh</span>
          </button>
        </div>
      )}

      {/* Category Filter Chips */}
      <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer shrink-0 border ${
                isActive
                  ? "bg-[#21262d] text-white border-[#30363d]"
                  : "border-transparent text-[#8b949e] hover:bg-[#161b22] hover:text-[#c9d1d9]"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Empty State */}
      {displayItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#30363d] bg-[#0d1117] py-8 px-4 text-center">
          <Inbox size={24} className="text-[#8b949e] mb-2 opacity-50" />
          <p className="text-xs font-semibold text-white">
            No activity in this feed
          </p>
          <p className="mt-1 text-[11px] text-[#8b949e] max-w-xs">
            {feedSource === "following"
              ? "Follow developers or watch repositories on GitHub to see their releases, stars, and projects here."
              : "Your recent GitHub actions will appear here."}
          </p>
          {feedSource === "following" && (
            <button
              type="button"
              onClick={() => setFeedSource("personal")}
              className="mt-3 rounded-md border border-[#30363d] bg-[#21262d] px-3 py-1 text-xs text-[#58a6ff] hover:bg-[#30363d] transition-colors cursor-pointer"
            >
              View Your Activity
            </button>
          )}
        </div>
      ) : (
        /* Activity Feed Cards List (matching GitHub screenshot) */
        <div className="space-y-3">
          {displayItems.map((item) => {
            const isExpanded = Boolean(expandedItems[item.id]);
            const badgeIcon = getFeedBadgeIcon(item.type);
            const badgeBg = getBadgeBg(item.type);

            return (
              <div
                key={item.id}
                className={`rounded-xl border border-[#30363d] bg-[#0d1117] transition-all hover:border-[#388bfd]/60 ${
                  compact ? "p-3 space-y-2" : "p-3.5 space-y-2.5"
                }`}
              >
                {/* Header: Actor Avatar + Action Phrase + Relative Time */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Actor Avatar with Small Badge */}
                    <div className="relative shrink-0">
                      {item.actor.avatarUrl ? (
                        <img
                          src={item.actor.avatarUrl}
                          alt={item.actor.login}
                          className="h-7 w-7 rounded-full border border-[#30363d] object-cover"
                        />
                      ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#21262d] text-[10px] font-bold text-zinc-300">
                          {item.actor.login.slice(0, 2).toUpperCase()}
                        </div>
                      )}

                      <span
                        className={`absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border ${badgeBg}`}
                      >
                        {badgeIcon}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1 leading-snug">
                      <p className="truncate text-xs text-[#c9d1d9]">
                        <span className="font-semibold text-white">
                          {item.headerText}
                        </span>
                      </p>
                      <p className="text-[10px] text-[#8b949e]">
                        {item.timeAgo}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openLink(item.url)}
                    title="Open on GitHub"
                    className="text-[#8b949e] hover:text-[#58a6ff] transition-colors p-1 rounded hover:bg-[#21262d] cursor-pointer shrink-0"
                  >
                    <ExternalLink size={12} />
                  </button>
                </div>

                {/* 1. Release Card Body (matching first card in screenshot) */}
                {item.type === "release" && (
                  <div className="space-y-2">
                    <h3
                      onClick={() => openLink(item.url)}
                      className="text-xs font-bold text-white hover:text-[#58a6ff] cursor-pointer transition-colors leading-snug"
                    >
                      {item.title}
                    </h3>

                    {item.body && (
                      <div className="rounded-lg border border-[#30363d]/80 bg-[#161b22] p-2.5 text-xs text-[#c9d1d9] leading-relaxed">
                        <p
                          className={
                            isExpanded ? "whitespace-pre-wrap" : "line-clamp-3"
                          }
                        >
                          {item.body}
                        </p>

                        {item.body.length > 120 && (
                          <button
                            type="button"
                            onClick={(e) => toggleExpand(item.id, e)}
                            className="mt-1 flex items-center gap-0.5 text-[11px] font-medium text-[#58a6ff] hover:underline cursor-pointer"
                          >
                            <span>{isExpanded ? "Show less" : "Read more"}</span>
                            {isExpanded ? (
                              <ChevronUp size={11} />
                            ) : (
                              <ChevronDown size={11} />
                            )}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Footer with release tag and reactions */}
                    <div className="flex items-center justify-between text-[11px] pt-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="flex items-center gap-1 rounded-full border border-[#30363d] bg-[#21262d] px-2 py-0.5 text-[10px] text-[#c9d1d9]">
                          <span>🪔</span>
                          <span className="font-mono">
                            {item.details?.tag || "v1.0"}
                          </span>
                        </span>
                        <span className="flex items-center gap-1 rounded-full border border-[#30363d] bg-[#21262d] px-2 py-0.5 text-[10px] text-[#8b949e]">
                          <span>👍</span>
                          <span>Active</span>
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => openLink(item.url)}
                        className="text-[11px] font-medium text-[#58a6ff] hover:underline cursor-pointer"
                      >
                        View Release ↗
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. Repository Created / Starred / Forked Card (matching second card in screenshot) */}
                {(item.type === "repo_created" ||
                  item.type === "star" ||
                  item.type === "fork") && (
                  <div className="rounded-lg border border-[#30363d]/80 bg-[#161b22] p-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div
                        onClick={() => openLink(item.url)}
                        className="flex items-center gap-1.5 cursor-pointer group"
                      >
                        <FolderGit2
                          size={13}
                          className="text-[#8b949e] shrink-0 group-hover:text-[#58a6ff]"
                        />
                        <span className="text-xs font-semibold text-[#58a6ff] group-hover:underline truncate">
                          {item.repoName}
                        </span>
                      </div>

                      {item.description && (
                        <p className="mt-1 text-[11px] text-[#8b949e] truncate">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => openLink(item.url)}
                      className="flex items-center gap-1 rounded-md border border-[#30363d] bg-[#21262d] px-2.5 py-1 text-xs font-medium text-[#c9d1d9] hover:bg-[#30363d] hover:text-white transition-colors cursor-pointer shrink-0"
                    >
                      <Star size={11} className="text-[#8b949e]" />
                      <span>Star</span>
                    </button>
                  </div>
                )}

                {/* 3. Pull Request / Issue / Push Card */}
                {item.type !== "release" &&
                  item.type !== "repo_created" &&
                  item.type !== "star" &&
                  item.type !== "fork" && (
                    <div className="rounded-lg border border-[#30363d]/80 bg-[#161b22] p-2.5 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p
                          onClick={() => openLink(item.url)}
                          className="text-xs font-medium text-white hover:text-[#58a6ff] cursor-pointer transition-colors truncate"
                        >
                          {item.title}
                        </p>
                        {item.description && (
                          <p className="mt-0.5 text-[11px] text-[#8b949e] truncate">
                            {item.description}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => openLink(item.url)}
                        className="text-[10px] text-[#58a6ff] hover:underline cursor-pointer shrink-0"
                      >
                        Open ↗
                      </button>
                    </div>
                  )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
