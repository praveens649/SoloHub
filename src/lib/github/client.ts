import type { GitHubRepository } from "./types";
const GITHUB_API = "https://api.github.com";
export interface GitHubSearchResult<T> {
  total_count: number;
  incomplete_results: boolean;
  items: T[];
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  state: "open" | "closed";
  merged_at: string | null;
  created_at: string;
  updated_at: string;
  repository_url: string;
  html_url: string;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  state: "open" | "closed";
  created_at: string;
  closed_at: string | null;
  repository_url: string;
  html_url: string;
}
export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    } | null;
  };
  repository?: {
    name: string;
  };
}
export interface GitHubEvent {
  id: string;
  type: string;
  created_at: string;
  repo: {
    name: string;
  };
  payload: {
    action?: string;
    ref?: string;
    commits?: Array<{
      sha: string;
      message: string;
    }>;
  };
}
export async function getRepositoryCommits(
  token: string,
  owner: string,
  repo: string,
  since: string,
  until: string
): Promise<GitHubCommit[]> {
  return githubFetch<GitHubCommit[]>(
    `/repos/${owner}/${repo}/commits?since=${encodeURIComponent(
      since
    )}&until=${encodeURIComponent(until)}&per_page=100`,
    token
  );
}
export async function getUserActivity(
  token: string,
  username: string
): Promise<GitHubEvent[]> {
  return githubFetch<GitHubEvent[]>(
    `/users/${username}/events?per_page=100`,
    token
  );
}
export async function getRepositories(
  token: string,
  starred = false
): Promise<GitHubRepository[]> {
  return githubFetch<GitHubRepository[]>(
    starred
      ? "/user/starred?sort=updated&direction=desc&per_page=100"
      : "/user/repos?sort=updated&direction=desc&per_page=100",
    token
  );
}
export async function githubFetch<T>(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${GITHUB_API}${endpoint}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(
      `GitHub API error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

export async function getGitHubUser(token: string) {
  return githubFetch<{
    id: number;
    login: string;
    name: string | null;
    avatar_url: string;
    html_url: string;
  }>("/user", token);
}
export async function searchGitHub<T>(
  token: string,
  query: string
): Promise<GitHubSearchResult<T>> {
  return githubFetch<GitHubSearchResult<T>>(
    `/search/issues?q=${encodeURIComponent(query)}&per_page=100`,
    token
  );
}