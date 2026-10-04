import { useWeeklyProductivity } from "../hooks/useWeeklyProductivity";
import { GitHubRateLimitMessage } from "./GitHubRateLimitMessage";

function formatDay(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "narrow",
  });
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
      <div className="rounded-lg border border-[#27272A] bg-[#0F0F11] p-3 text-center">
        <p className="text-xs text-[#71717A]">Loading weekly activity...</p>
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

  const maxCommits = Math.max(...data.week.map((d) => d.commits), 1);

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold text-[#FAFAFA]">
            Last 7 Days
          </h2>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
          <span>🔥</span>
          <span>{data.streak} day streak</span>
        </div>
      </div>

      <div className="rounded-lg border border-[#27272A] bg-[#0F0F11] p-2.5">
        <div className="flex h-16 items-end justify-between gap-1.5 pt-2">
          {data.week.map((day) => {
            const heightPercent =
              day.commits === 0
                ? 8
                : Math.max((day.commits / maxCommits) * 100, 16);

            return (
              <div
                key={day.date}
                className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
                title={`${day.date}: ${day.commits} commits`}
              >
                <div
                  className={`w-full rounded-xs transition-all duration-150 ${
                    day.commits > 0
                      ? "bg-[#FAFAFA] opacity-90"
                      : "bg-[#27272A] opacity-40"
                  }`}
                  style={{
                    height: `${heightPercent}%`,
                  }}
                />

                <span className="text-[10px] text-[#71717A] uppercase font-mono">
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