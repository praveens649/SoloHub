import type {
  CollaboratorPermission,
  GitHubCollaborator,
  GitHubCollaboratorInvitation,
  GitHubRepository,
} from "./types";
import {
  GitHubApiError,
  GitHubNetworkError,
  formatGitHubError,
} from "./errors";

export { GitHubApiError, GitHubNetworkError, formatGitHubError };
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
  draft?: boolean;
  comments?: number;
  review_comments?: number;
  user?: {
    login: string;
    avatar_url?: string;
  };
  pull_request?: {
    merged_at?: string | null;
    html_url?: string;
  };
  repository?: {
    owner: string;
    name: string;
    full_name: string;
  };
}

export interface GitHubMergeResult {
  sha: string;
  merged: boolean;
  message: string;
}

export interface GitHubIssueLabel {
  id: number;
  name: string;
  color: string;
  description?: string | null;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  state: "open" | "closed";
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  repository_url: string;
  html_url: string;
  body?: string | null;
  comments?: number;
  labels?: GitHubIssueLabel[];
  user?: {
    login: string;
    avatar_url?: string;
  };
  repository?: {
    owner: string;
    name: string;
    full_name: string;
  };
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
  author?: {
    login: string;
  } | null;
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
  until: string,
  author?: string
): Promise<GitHubCommit[]> {
  const authorParam = author ? `&author=${encodeURIComponent(author)}` : "";
  return githubFetch<GitHubCommit[]>(
    `/repos/${owner}/${repo}/commits?since=${encodeURIComponent(
      since
    )}&until=${encodeURIComponent(until)}${authorParam}&per_page=100`,
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
export interface PaginatedResult<T> {
  data: T[];
  hasMore: boolean;
}

export async function fetchPaginated<T>(
  endpoint: string,
  token: string,
  options: {
    perPage?: number;
    maxPages?: number;
    fetchOptions?: RequestInit;
  } = {}
): Promise<PaginatedResult<T>> {
  const perPage = options.perPage ?? 100;
  const maxPages = options.maxPages ?? 2;
  const allItems: T[] = [];
  let page = 1;
  let hasMore = false;

  const separator = endpoint.includes("?") ? "&" : "?";

  while (page <= maxPages) {
    const pageUrl = `${endpoint}${separator}page=${page}&per_page=${perPage}`;

    const items = await githubFetch<T[]>(pageUrl, token, options.fetchOptions);
    if (!Array.isArray(items) || items.length === 0) {
      break;
    }

    allItems.push(...items);

    if (items.length < perPage) {
      hasMore = false;
      break;
    }

    if (page === maxPages) {
      hasMore = true;
    }

    page++;
  }

  return { data: allItems, hasMore };
}

export async function getRepositories(
  token: string,
  starred = false,
  maxPages = 2
): Promise<GitHubRepository[]> {
  const endpoint = starred
    ? "/user/starred?sort=updated&direction=desc"
    : "/user/repos?sort=updated&direction=desc";

  const { data } = await fetchPaginated<GitHubRepository>(endpoint, token, {
    perPage: 100,
    maxPages,
  });

  return data;
}

export async function githubFetch<T>(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${GITHUB_API}${endpoint}`, {
      ...options,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...options.headers,
      },
    });
  } catch (err) {
    if (
      err instanceof TypeError ||
      (err instanceof Error && err.name === "TypeError")
    ) {
      throw new GitHubNetworkError();
    }
    throw err;
  }

  const limitHeader = response.headers.get("x-ratelimit-limit");
  const remainingHeader = response.headers.get("x-ratelimit-remaining");
  const resetHeader = response.headers.get("x-ratelimit-reset");

  const rateLimitLimit = limitHeader ? parseInt(limitHeader, 10) : null;
  const rateLimitRemaining = remainingHeader
    ? parseInt(remainingHeader, 10)
    : null;
  const rateLimitReset = resetHeader ? parseInt(resetHeader, 10) : null;

  if (!response.ok) {
    let errorMessage = `GitHub API error: ${response.status} ${response.statusText}`;
    let documentationUrl: string | null = null;

    try {
      const errorData = await response.json();
      if (errorData?.message) {
        errorMessage = errorData.message;
      }
      if (errorData?.documentation_url) {
        documentationUrl = errorData.documentation_url;
      }
    } catch {
      // Ignore json parse error and keep default statusText
    }

    throw new GitHubApiError({
      message: errorMessage,
      status: response.status,
      rateLimitLimit,
      rateLimitRemaining,
      rateLimitReset,
      documentationUrl,
    });
  }

  if (
    response.status === 204 ||
    response.headers.get("content-length") === "0"
  ) {
    return null as T;
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
    `/search/issues?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=30`,
    token
  );
}

export async function getUserPullRequests(
  token: string,
  username: string,
  state: "open" | "closed" = "open"
): Promise<GitHubPullRequest[]> {
  const query = `author:${username} is:pr is:${state}`;
  const result = await searchGitHub<GitHubPullRequest>(token, query);

  const items = Array.isArray(result?.items) ? result.items : [];

  return items.map((item) => {
    const parts = item.repository_url ? item.repository_url.split("/") : [];
    const name = parts[parts.length - 1] || "";
    const owner = parts[parts.length - 2] || "";

    return {
      ...item,
      merged_at: item.merged_at ?? item.pull_request?.merged_at ?? null,
      repository: {
        owner,
        name,
        full_name: owner && name ? `${owner}/${name}` : "",
      },
    };
  });
}

export async function mergePullRequest(
  token: string,
  owner: string,
  repo: string,
  pullNumber: number,
  mergeMethod: "squash" | "merge" | "rebase" = "squash"
): Promise<GitHubMergeResult> {
  return githubFetch<GitHubMergeResult>(
    `/repos/${owner}/${repo}/pulls/${pullNumber}/merge`,
    token,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        merge_method: mergeMethod,
      }),
    }
  );
}

export async function getUserIssues(
  token: string,
  username: string,
  state: "open" | "closed" = "open"
): Promise<GitHubIssue[]> {
  const query = `author:${username} is:issue is:${state}`;
  const result = await searchGitHub<GitHubIssue>(token, query);

  const items = Array.isArray(result?.items) ? result.items : [];

  return items.map((item) => {
    const parts = item.repository_url ? item.repository_url.split("/") : [];
    const name = parts[parts.length - 1] || "";
    const owner = parts[parts.length - 2] || "";

    return {
      ...item,
      repository: {
        owner,
        name,
        full_name: owner && name ? `${owner}/${name}` : "",
      },
    };
  });
}

export async function updateIssueState(
  token: string,
  owner: string,
  repo: string,
  issueNumber: number,
  state: "open" | "closed"
): Promise<GitHubIssue> {
  return githubFetch<GitHubIssue>(
    `/repos/${owner}/${repo}/issues/${issueNumber}`,
    token,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        state,
      }),
    }
  );
}

export async function createIssue(
  token: string,
  owner: string,
  repo: string,
  title: string,
  body?: string
): Promise<GitHubIssue> {
  return githubFetch<GitHubIssue>(
    `/repos/${owner}/${repo}/issues`,
    token,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        ...(body ? { body } : {}),
      }),
    }
  );
}

export interface CreateRepositoryParams {
  name: string;
  description?: string;
  private?: boolean;
  autoInit?: boolean;
}

export async function createRepository(
  token: string,
  params: CreateRepositoryParams
): Promise<GitHubRepository> {
  return githubFetch<GitHubRepository>(
    "/user/repos",
    token,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: params.name,
        description: params.description || undefined,
        private: Boolean(params.private),
        auto_init: Boolean(params.autoInit),
      }),
    }
  );
}

export async function getRepositoryCollaborators(
  token: string,
  owner: string,
  repo: string
): Promise<GitHubCollaborator[]> {
  return githubFetch<GitHubCollaborator[]>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(
      repo
    )}/collaborators?per_page=100`,
    token
  );
}

export async function addRepositoryCollaborator(
  token: string,
  owner: string,
  repo: string,
  username: string,
  permission: CollaboratorPermission = "push"
): Promise<GitHubCollaboratorInvitation | null> {
  return githubFetch<GitHubCollaboratorInvitation | null>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(
      repo
    )}/collaborators/${encodeURIComponent(username)}`,
    token,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        permission,
      }),
    }
  );
}

export async function removeRepositoryCollaborator(
  token: string,
  owner: string,
  repo: string,
  username: string
): Promise<void> {
  await githubFetch<void>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(
      repo
    )}/collaborators/${encodeURIComponent(username)}`,
    token,
    {
      method: "DELETE",
    }
  );
}