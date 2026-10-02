import type { GitHubRepository } from "./types";
const GITHUB_API = "https://api.github.com";


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