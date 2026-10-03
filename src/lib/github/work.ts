import type {
  GitHubIssue,
  GitHubPullRequest,
} from "./client";
import { searchGitHub } from "./client";

export interface GitHubWorkSummary {
  pullRequests: number;
  mergedPullRequests: number;
  issues: number;
  closedIssues: number;
  activeRepositories: number;
}

function getDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function getTodayWork(
  token: string,
  username: string
): Promise<GitHubWorkSummary> {
  const today = getDateString(new Date());

  const [prs, issues] = await Promise.all([
    searchGitHub<GitHubPullRequest>(
      token,
      `author:${username} is:pr created:${today}`
    ),

    searchGitHub<GitHubIssue>(
      token,
      `author:${username} is:issue created:${today}`
    ),
  ]);

  const prItems = Array.isArray(prs?.items) ? prs.items : [];
  const issueItems = Array.isArray(issues?.items) ? issues.items : [];

  const mergedPullRequests = prItems.filter(
    (pr) => pr.merged_at !== null
  ).length;

  const repositories = new Set<string>();

  for (const pr of prItems) {
    if (pr?.repository_url) {
      repositories.add(pr.repository_url);
    }
  }

  for (const issue of issueItems) {
    if (issue?.repository_url) {
      repositories.add(issue.repository_url);
    }
  }

  return {
    pullRequests: prs?.total_count ?? prItems.length,
    mergedPullRequests,
    issues: issues?.total_count ?? issueItems.length,
    closedIssues: issueItems.filter(
      (issue) => issue.closed_at !== null
    ).length,
    activeRepositories: repositories.size,
  };
}