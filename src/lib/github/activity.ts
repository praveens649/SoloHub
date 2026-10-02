import type { GitHubEvent } from "./client";

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
    repositories.add(event.repo.name);

    switch (event.type) {
      case "PushEvent":
        commits += event.payload.commits?.length ?? 0;
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