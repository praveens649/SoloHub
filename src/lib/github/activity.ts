import type { GitHubEvent, GitHubNotification } from "./client";

export interface ActivityStats {
  commits: number;
  pullRequests: number;
  issues: number;
  reviews: number;
  repositories: number;
}

export function calculateActivityStats(
  events: GitHubEvent[]
): ActivityStats {
  const repositories = new Set<string>();

  let commits = 0;
  let pullRequests = 0;
  let issues = 0;
  let reviews = 0;

  for (const event of events) {
    if (event.repo?.name) {
      repositories.add(event.repo.name);
    }

    switch (event.type) {
      case "PushEvent":
        commits += event.payload?.commits?.length ?? 0;
        break;

      case "PullRequestEvent":
        pullRequests++;
        break;

      case "IssuesEvent":
        issues++;
        break;

      case "PullRequestReviewEvent":
        reviews++;
        break;
    }
  }

  return {
    commits,
    pullRequests,
    issues,
    reviews,
    repositories: repositories.size,
  };
}

export type ActivityCategory =
  | "all"
  | "releases"
  | "repos"
  | "prs"
  | "issues"
  | "reviews"
  | "commits"
  | "other";

export interface ActivityItem {
  id: string;
  type:
    | "release"
    | "repo_created"
    | "star"
    | "fork"
    | "pr"
    | "issue"
    | "review"
    | "commit"
    | "branch"
    | "other";
  eventType: string;
  category: ActivityCategory;
  headerText: string;
  repoName: string;
  title: string;
  description?: string;
  body?: string;
  actor: {
    login: string;
    avatarUrl?: string;
  };
  createdAt: string;
  timeAgo: string;
  url: string;
  isFollowing?: boolean;
  details?: {
    language?: string;
    branch?: string;
    commitsCount?: number;
    tag?: string;
  };
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 30) {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
  if (diffDays === 1) return "yesterday";
  if (diffDays > 1) return `${diffDays} days ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMin > 0) return `${diffMin}m ago`;
  return "just now";
}

/**
 * Transforms raw GitHub events and optional notifications into rich,
 * authentic GitHub-style feed items.
 */
export function formatGitHubEvents(
  events: GitHubEvent[],
  notifications?: GitHubNotification[],
  isFollowingFeed = false
): ActivityItem[] {
  const items: ActivityItem[] = [];
  const seenIds = new Set<string>();

  for (const event of events) {
    if (!event || seenIds.has(event.id)) continue;
    seenIds.add(event.id);

    const repoName = event.repo?.name || "unknown/repo";
    const actor = {
      login: event.actor?.login || "user",
      avatarUrl: event.actor?.avatar_url,
    };
    const createdAt = event.created_at || new Date().toISOString();
    const timeAgo = formatRelativeTime(createdAt);

    switch (event.type) {
      case "ReleaseEvent": {
        const release = event.payload?.release;
        const tag = release?.tag_name || "release";
        const title = release?.name || tag;
        const body = release?.body || undefined;
        const url = release?.html_url || `https://github.com/${repoName}/releases`;

        items.push({
          id: event.id,
          type: "release",
          eventType: event.type,
          category: "releases",
          headerText: `${actor.login}/${repoName.split("/")[1] || repoName} released`,
          repoName,
          title,
          description: tag !== title ? tag : undefined,
          body,
          actor,
          createdAt,
          timeAgo,
          url,
          isFollowing: isFollowingFeed,
          details: { tag },
        });
        break;
      }

      case "CreateEvent": {
        const refType = event.payload?.ref_type || "repository";
        const isRepo = refType === "repository";
        const url = `https://github.com/${repoName}`;
        const description = event.payload?.description || undefined;

        items.push({
          id: event.id,
          type: isRepo ? "repo_created" : "branch",
          eventType: event.type,
          category: isRepo ? "repos" : "other",
          headerText: isRepo
            ? `${actor.login} created a repository`
            : `${actor.login} created ${refType} in ${repoName}`,
          repoName,
          title: repoName,
          description,
          actor,
          createdAt,
          timeAgo,
          url,
          isFollowing: isFollowingFeed,
          details: {
            branch: isRepo ? undefined : event.payload?.ref,
          },
        });
        break;
      }

      case "WatchEvent": {
        items.push({
          id: event.id,
          type: "star",
          eventType: event.type,
          category: "repos",
          headerText: `${actor.login} starred ${repoName}`,
          repoName,
          title: repoName,
          description: event.payload?.description || `Starred repository ${repoName}`,
          actor,
          createdAt,
          timeAgo,
          url: `https://github.com/${repoName}`,
          isFollowing: isFollowingFeed,
        });
        break;
      }

      case "ForkEvent": {
        const forkee = event.payload?.forkee;
        const forkeeName = forkee?.full_name || `${actor.login}/${repoName.split("/")[1] || "fork"}`;
        const url = forkee?.html_url || `https://github.com/${forkeeName}`;

        items.push({
          id: event.id,
          type: "fork",
          eventType: event.type,
          category: "repos",
          headerText: `${actor.login} forked ${repoName} to ${forkeeName}`,
          repoName: forkeeName,
          title: forkeeName,
          description: forkee?.description || `Forked from ${repoName}`,
          actor,
          createdAt,
          timeAgo,
          url,
          isFollowing: isFollowingFeed,
        });
        break;
      }

      case "PullRequestEvent": {
        const pr = event.payload?.pull_request;
        const prNum = pr?.number;
        const action = event.payload?.action || (pr?.merged ? "merged" : "opened");
        const title = pr?.title || `Pull Request #${prNum ?? ""}`;
        const url =
          pr?.html_url ||
          (prNum
            ? `https://github.com/${repoName}/pull/${prNum}`
            : `https://github.com/${repoName}/pulls`);

        items.push({
          id: event.id,
          type: "pr",
          eventType: event.type,
          category: "prs",
          headerText: `${actor.login} ${action === "closed" && pr?.merged ? "merged" : action} a pull request in ${repoName}`,
          repoName,
          title,
          description: prNum ? `PR #${prNum} in ${repoName}` : repoName,
          actor,
          createdAt,
          timeAgo,
          url,
          isFollowing: isFollowingFeed,
        });
        break;
      }

      case "IssuesEvent": {
        const issue = event.payload?.issue;
        const issueNum = issue?.number;
        const action = event.payload?.action || "opened";
        const title = issue?.title || `Issue #${issueNum ?? ""}`;
        const url =
          issue?.html_url ||
          (issueNum
            ? `https://github.com/${repoName}/issues/${issueNum}`
            : `https://github.com/${repoName}/issues`);

        items.push({
          id: event.id,
          type: "issue",
          eventType: event.type,
          category: "issues",
          headerText: `${actor.login} ${action} an issue in ${repoName}`,
          repoName,
          title,
          description: issueNum ? `Issue #${issueNum} in ${repoName}` : repoName,
          actor,
          createdAt,
          timeAgo,
          url,
          isFollowing: isFollowingFeed,
        });
        break;
      }

      case "PullRequestReviewEvent": {
        const pr = event.payload?.pull_request;
        const review = event.payload?.review;
        const state = review?.state?.toLowerCase();
        let action = "reviewed";
        if (state === "approved") action = "approved";
        else if (state === "changes_requested") action = "requested changes on";

        const title = pr?.title ? pr.title : "Pull Request Review";
        const url =
          review?.html_url ||
          pr?.html_url ||
          `https://github.com/${repoName}/pulls`;

        items.push({
          id: event.id,
          type: "review",
          eventType: event.type,
          category: "reviews",
          headerText: `${actor.login} ${action} a pull request in ${repoName}`,
          repoName,
          title,
          description: pr?.number ? `PR #${pr.number} in ${repoName}` : repoName,
          actor,
          createdAt,
          timeAgo,
          url,
          isFollowing: isFollowingFeed,
        });
        break;
      }

      case "PushEvent": {
        const commits = event.payload?.commits || [];
        const commitCount = commits.length;
        const firstMessage = commits[0]?.message?.split("\n")[0] || "Pushed code";
        const branch = event.payload?.ref?.replace("refs/heads/", "") || "main";
        const url = commits[0]?.sha
          ? `https://github.com/${repoName}/commit/${commits[0].sha}`
          : `https://github.com/${repoName}/tree/${branch}`;

        items.push({
          id: event.id,
          type: "commit",
          eventType: event.type,
          category: "commits",
          headerText: `${actor.login} pushed to ${branch} in ${repoName}`,
          repoName,
          title: firstMessage,
          description: `${commitCount} commit${commitCount === 1 ? "" : "s"} to ${branch}`,
          actor,
          createdAt,
          timeAgo,
          url,
          isFollowing: isFollowingFeed,
          details: { branch, commitsCount: commitCount },
        });
        break;
      }

      default: {
        items.push({
          id: event.id,
          type: "other",
          eventType: event.type,
          category: "other",
          headerText: `${actor.login} updated ${repoName}`,
          repoName,
          title: `${event.type} in ${repoName}`,
          actor,
          createdAt,
          timeAgo,
          url: `https://github.com/${repoName}`,
          isFollowing: isFollowingFeed,
        });
        break;
      }
    }
  }

  // Optionally include repository notifications if provided
  if (notifications && notifications.length > 0) {
    for (const notif of notifications) {
      const notifId = `notif-${notif.id}`;
      if (seenIds.has(notifId)) continue;
      seenIds.add(notifId);

      const repoName = notif.repository?.full_name || notif.repository?.name || "repo";
      const subjectType = notif.subject?.type?.toLowerCase() || "";
      const isPR = subjectType.includes("pull");
      const isIssue = subjectType.includes("issue");

      const category: ActivityCategory = isPR
        ? "prs"
        : isIssue
        ? "issues"
        : "other";

      const type: ActivityItem["type"] = isPR
        ? "pr"
        : isIssue
        ? "issue"
        : "other";

      const url =
        notif.repository?.html_url || `https://github.com/${repoName}`;

      items.push({
        id: notifId,
        type,
        eventType: "Notification",
        category,
        headerText: `${notif.repository?.owner?.login || "GitHub"} updated ${repoName}`,
        repoName,
        title: notif.subject?.title || `Notification from ${repoName}`,
        description: `Notification (${notif.subject?.type || "update"})`,
        actor: {
          login: notif.repository?.owner?.login || "github",
          avatarUrl: notif.repository?.owner?.avatar_url,
        },
        createdAt: notif.updated_at || new Date().toISOString(),
        timeAgo: formatRelativeTime(notif.updated_at || new Date().toISOString()),
        url,
        isFollowing: false,
      });
    }
  }

  // Sort descending by creation date
  return items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Filters activity items by category.
 */
export function filterActivityItems(
  items: ActivityItem[],
  category: ActivityCategory
): ActivityItem[] {
  if (category === "all") return items;
  return items.filter((item) => item.category === category);
}
