import type { GitHubRepository } from "./types";
import { getRepositoryCommits } from "./client";

export interface DailyActivity {
  date: string;
  commits: number;
  repositories: number;
}

export interface ProductivitySummary {
  today: DailyActivity;
  week: DailyActivity[];
  streak: number;
}

function getDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getLast7Days() {
  const days: Date[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();

    date.setDate(date.getDate() - i);

    days.push(date);
  }

  return days;
}

export async function mapConcurrent<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) return [];
  const results: R[] = new Array(items.length);
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < items.length) {
      const index = currentIndex++;
      results[index] = await fn(items[index], index);
    }
  }

  const workerCount = Math.min(limit, items.length);
  const workers = Array.from({ length: workerCount }, () => worker());
  await Promise.all(workers);
  return results;
}

export async function getWeeklyProductivity(
  token: string,
  repositories: GitHubRepository[],
  author?: string
): Promise<ProductivitySummary> {
  const days = getLast7Days();

  const since = new Date(days[0]);
  since.setHours(0, 0, 0, 0);

  const until = new Date();
  until.setHours(23, 59, 59, 999);

  const activityMap = new Map<string, DailyActivity>();

  for (const day of days) {
    const key = getDateKey(day);

    activityMap.set(key, {
      date: key,
      commits: 0,
      repositories: 0,
    });
  }

  // Filter repositories that have been updated since 7 days ago (plus buffer)
  // to avoid querying dozens of stale repositories
  const relevantRepositories = repositories.filter((repo) => {
    if (!repo.updated_at) return true;
    const updatedAt = new Date(repo.updated_at);
    return updatedAt.getTime() >= since.getTime() - 24 * 60 * 60 * 1000;
  });

  const results = await mapConcurrent(
    relevantRepositories,
    5,
    async (repository) => {
      try {
        const commits = await getRepositoryCommits(
          token,
          repository.owner.login,
          repository.name,
          since.toISOString(),
          until.toISOString(),
          author
        );

        return {
          repository: repository.name,
          commits,
        };
      } catch {
        return {
          repository: repository.name,
          commits: [],
        };
      }
    }
  );

  for (const result of results) {
    const activeDays = new Set<string>();

    for (const commit of result.commits) {
      const commitDate =
        commit.commit.author?.date;

      if (!commitDate) continue;

      const key = getDateKey(
        new Date(commitDate)
      );

      const activity = activityMap.get(key);

      if (!activity) continue;

      activity.commits++;
      activeDays.add(key);
    }

    for (const day of activeDays) {
      const activity = activityMap.get(day);

      if (activity) {
        activity.repositories++;
      }
    }
  }

  const week = Array.from(activityMap.values());

  let streak = 0;

  for (let i = week.length - 1; i >= 0; i--) {
    if (week[i].commits > 0) {
      streak++;
    } else {
      break;
    }
  }

  return {
    today: week[week.length - 1],
    week,
    streak,
  };
}

export async function getTodayProductivity(
  token: string,
  repositories: GitHubRepository[],
  author?: string
): Promise<DailyActivity> {
  const summary = await getWeeklyProductivity(
    token,
    repositories,
    author
  );

  return summary.today;
}