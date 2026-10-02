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

  const mergedPullRequests = prs.items.filter(
    (pr) => pr.merged_at !== null
  ).length;

  const repositories = new Set<string>();

  for (const pr of prs.items) {
    repositories.add(pr.repository_url);
  }

  for (const issue of issues.items) {
    repositories.add(issue.repository_url);
  }

  return {
    pullRequests: prs.total_count,
    mergedPullRequests,
    issues: issues.total_count,
    closedIssues: issues.items.filter(
      (issue) => issue.closed_at !== null
    ).length,
    activeRepositories: repositories.size,
  };
}