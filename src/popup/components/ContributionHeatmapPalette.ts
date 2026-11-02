export type HeatmapIntensity = 0 | 1 | 2 | 3 | 4;

export interface HeatmapColorDef {
  bg: string;
  border?: string;
  glow?: string;
  hex: string;
}

export const DIWALI_HEATMAP_PALETTE: Record<HeatmapIntensity, HeatmapColorDef> = {
  0: {
    bg: "bg-[#161b22]",
    border: "border-[#27272A]/50",
    hex: "#161b22",
  },
  1: {
    bg: "bg-[#7C2D12]", // Deep amber rust
    border: "border-[#9A3412]",
    hex: "#7C2D12",
  },
  2: {
    bg: "bg-[#EA580C]", // Saffron
    border: "border-[#FB923C]",
    hex: "#EA580C",
  },
  3: {
    bg: "bg-[#F59E0B]", // Radiant amber
    border: "border-[#FCD34D]",
    glow: "shadow-[0_0_6px_rgba(245,158,11,0.4)]",
    hex: "#F59E0B",
  },
  4: {
    bg: "bg-[#FACC15]", // Festive gold
    border: "border-[#FEF08A]",
    glow: "shadow-[0_0_10px_rgba(250,204,21,0.6)]",
    hex: "#FACC15",
  },
};

export const CLASSIC_HEATMAP_PALETTE: Record<HeatmapIntensity, HeatmapColorDef> = {
  0: {
    bg: "bg-[#161b22]",
    border: "border-[rgba(255,255,255,0.05)]",
    hex: "#161b22",
  },
  1: {
    bg: "bg-[#0e4429]", // GitHub level 1 dark green
    border: "border-[#00471b]",
    hex: "#0e4429",
  },
  2: {
    bg: "bg-[#006d32]", // GitHub level 2 medium green
    border: "border-[#007a2f]",
    hex: "#006d32",
  },
  3: {
    bg: "bg-[#26a641]", // GitHub level 3 bright green
    border: "border-[#34d399]/40",
    glow: "shadow-[0_0_6px_rgba(38,166,65,0.3)]",
    hex: "#26a641",
  },
  4: {
    bg: "bg-[#39d353]", // GitHub level 4 vibrant light green
    border: "border-[#56d364]",
    glow: "shadow-[0_0_8px_rgba(57,211,83,0.45)]",
    hex: "#39d353",
  },
};

export function getHeatmapIntensity(
  count: number,
  maxCount = 4
): HeatmapIntensity {
  if (count <= 0) return 0;
  if (maxCount <= 1) return 4;
  const ratio = count / maxCount;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

export function toLocalDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export interface HeatmapDayData {
  date: string; // YYYY-MM-DD
  count: number;
  isFuture: boolean;
  dayOfWeek: number; // 0=Sun, 6=Sat
}

export interface HeatmapWeekData {
  days: HeatmapDayData[];
}

export interface HeatmapMonthLabel {
  colIndex: number;
  label: string;
}

/**
 * Builds standard 52-week GitHub calendar grid ending on the current week.
 * Calculates total contributions across the year and specifically for the current calendar year.
 */
export function buildYearContributionGrid(
  referenceDate: Date = new Date(),
  activityMap: Map<string, number> = new Map()
): {
  weeks: HeatmapWeekData[];
  months: HeatmapMonthLabel[];
  maxCount: number;
  totalContributions: number;
  currentYearContributions: number;
  currentYear: number;
} {
  const currentYear = referenceDate.getFullYear();
  const currentYearPrefix = String(currentYear);

  const dayOfWeek = referenceDate.getDay(); // 0 for Sunday
  const endSunday = new Date(referenceDate);
  endSunday.setDate(referenceDate.getDate() - dayOfWeek);
  // Noon anchor guarantees consistent ISO date formatting across all international timezones
  endSunday.setHours(12, 0, 0, 0);

  const refTime = referenceDate.getTime();
  const weeks: HeatmapWeekData[] = [];
  const months: HeatmapMonthLabel[] = [];
  let lastMonth = -1;
  let maxCount = 1;
  let totalContributions = 0;
  let currentYearContributions = 0;

  for (let w = 51; w >= 0; w--) {
    const colIndex = 51 - w;
    const weekStart = new Date(endSunday);
    weekStart.setDate(endSunday.getDate() - w * 7);

    // Track month label at first week of new month
    const mNum = weekStart.getMonth();
    if (mNum !== lastMonth) {
      months.push({
        colIndex,
        label: weekStart.toLocaleDateString("en-US", { month: "short" }),
      });
      lastMonth = mNum;
    }

    const days: HeatmapDayData[] = [];
    for (let d = 0; d < 7; d++) {
      const curDate = new Date(weekStart);
      curDate.setDate(weekStart.getDate() + d);
      const isFuture = curDate.getTime() > refTime + 24 * 60 * 60 * 1000;
      const dateKey = curDate.toISOString().slice(0, 10);
      const count = isFuture ? 0 : activityMap.get(dateKey) || 0;

      if (count > 0) {
        totalContributions += count;
        if (dateKey.startsWith(currentYearPrefix)) {
          currentYearContributions += count;
        }
        if (count > maxCount) maxCount = count;
      }

      days.push({
        date: dateKey,
        count,
        isFuture,
        dayOfWeek: d,
      });
    }

    weeks.push({ days });
  }

  return {
    weeks,
    months,
    maxCount,
    totalContributions,
    currentYearContributions,
    currentYear,
  };
}
