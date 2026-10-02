import { useEffect, useState } from "react";
import { getGoals } from "../../lib/storage/goals";

interface DailyGoalProps {
  commits: number;
}

export function DailyGoal({
  commits,
}: DailyGoalProps) {
  const [goal, setGoal] = useState(10);

  useEffect(() => {
    getGoals().then((goals) => {
      setGoal(goals.commits);
    });
  }, []);

  const progress = Math.min(
    Math.round((commits / goal) * 100),
    100
  );

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-500">
            Daily Goal
          </p>

          <p className="text-sm font-medium text-white">
            {commits} / {goal} commits
          </p>
        </div>

        <span className="text-xs text-zinc-500">
          {progress}%
        </span>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-white transition-all"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>
    </div>
  );
}