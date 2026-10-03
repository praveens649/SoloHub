import { useWeeklyProductivity } from "../hooks/useWeeklyProductivity";
import { GitHubRateLimitMessage } from "./GitHubRateLimitMessage";

function formatDay(date: string) {
  return new Date(date).toLocaleDateString(
    "en-US",
    {
      weekday: "short",
    }
  );
}

export function WeeklyActivity() {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useWeeklyProductivity();

  if (isLoading && !data) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <p className="text-xs text-zinc-500">
        Loading weekly activity...
        </p>
      </div>
    );
  }

  if (isError && !data) {
    return (
      <GitHubRateLimitMessage error={error} onRetry={() => refetch()} />
    );
  }

  if (!data) {
    return null;
  }

  const maxCommits = Math.max(
    ...data.week.map((day) => day.commits),
    1
  );

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-500">
            Activity
          </p>

          <h2 className="text-lg font-semibold text-white">
            Last 7 Days
          </h2>
        </div>

        <div className="text-right">
          <p className="text-xs text-zinc-500">
            Streak
          </p>

          <p className="text-sm font-semibold text-white">
            🔥 {data.streak} days
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
        <div className="flex h-32 items-end justify-between gap-2">
          {data.week.map((day) => {
            const height =
              day.commits === 0
                ? 4
                : Math.max(
                    (day.commits / maxCommits) * 100,
                    8
                  );

            return (
              <div
                key={day.date}
                className="flex h-full flex-1 flex-col items-center justify-end gap-2"
              >
                <span className="text-[10px] text-zinc-500">
                  {day.commits}
                </span>

                <div
                  className="w-full rounded-sm bg-white/80 transition"
                  style={{
                    height: `${height}%`,
                  }}
                />

                <span className="text-[10px] text-zinc-600">
                  {formatDay(day.date)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}