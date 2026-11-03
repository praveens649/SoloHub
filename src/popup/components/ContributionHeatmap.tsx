import { useState, useEffect, useRef, useMemo } from "react";
import { Sparkles } from "lucide-react";
import { useWeeklyProductivity } from "../hooks/useWeeklyProductivity";
import { useYearlyContributions } from "../hooks/useYearlyContributions";
import { useActivityFeed } from "../hooks/useActivityFeed";
import { GitHubRateLimitMessage } from "./GitHubRateLimitMessage";
import {
  getUserPreferences,
  setHeatmapPalettePreference,
  type HeatmapPalettePreference,
} from "../../lib/storage/preferences";
import type { DailyActivity } from "../../lib/github/productivity";
import {
  DIWALI_HEATMAP_PALETTE,
  CLASSIC_HEATMAP_PALETTE,
  getHeatmapIntensity,
  buildYearContributionGrid,
  type HeatmapDayData,
} from "./ContributionHeatmapPalette";

function formatFullTooltipDate(dateString: string): string {
  const parts = dateString.split("-").map((p) => parseInt(p, 10));
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export interface ContributionHeatmapProps {
  palette?: HeatmapPalettePreference;
  onPaletteChange?: (palette: HeatmapPalettePreference) => void;
  customDays?: DailyActivity[];
  customContributions?: Record<string, number>;
}

export function ContributionHeatmap({
  palette: propPalette,
  onPaletteChange,
  customDays,

  customContributions,
}: ContributionHeatmapProps) {
  const {
    data: weeklyData,
    isLoading: weeklyLoading,
    isError: weeklyError,
    error,
    refetch: refetchWeekly,
  } = useWeeklyProductivity();

  const {
    data: yearlyData,
    isLoading: yearlyLoading,
    refetch: refetchYearly,
  } = useYearlyContributions();

  const { data: activityItems } = useActivityFeed();

  const [storedPalette, setStoredPalette] =
    useState<HeatmapPalettePreference>("diwali");
  const [hoveredDay, setHoveredDay] = useState<HeatmapDayData | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const activePalette = propPalette || storedPalette;

  useEffect(() => {
    if (propPalette) return;

    let isMounted = true;
    void getUserPreferences().then((prefs) => {
      if (isMounted) {
        setStoredPalette(prefs.heatmapPalette);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [propPalette]);

  // Aggregate verified contributions across the entire year
  const activityMap = useMemo(() => {
    const map = new Map<string, number>();

    // 1. Primary source: Full year GitHub GraphQL contribution calendar
    if (yearlyData?.days && yearlyData.days.size > 0) {
      for (const [date, count] of yearlyData.days.entries()) {
        if (count > 0) {
          map.set(date, count);
        }
      }
    }

    // 2. Ingest custom contributions if passed (e.g., in unit tests)
    if (customContributions) {
      for (const [date, count] of Object.entries(customContributions)) {
        map.set(date, (map.get(date) || 0) + count);
      }
    }

    // 3. Fallback / Merge: Ingest verified commits from weekly productivity
    const days = customDays || weeklyData?.week || [];
    for (const day of days) {
      if (day.commits > 0) {
        map.set(day.date, Math.max(map.get(day.date) || 0, day.commits));
      }
    }

    // 4. Ingest recent GitHub activity items
    if (activityItems && activityItems.length > 0) {
      for (const item of activityItems) {
        const dateKey = item.createdAt.slice(0, 10);
        if (!map.has(dateKey)) {
          map.set(dateKey, 1);
        }
      }
    }

    return map;
  }, [yearlyData, customContributions, customDays, weeklyData, activityItems]);

  // Build the 52-week calendar grid and calculate current-year contributions
  const {
    weeks,
    months,
    maxCount,
    totalContributions,
    currentYearContributions,
    currentYear,
  } = useMemo(() => {
    return buildYearContributionGrid(new Date(), activityMap);
  }, [activityMap]);

  // Automatically scroll grid to the right (most recent months) on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft =
        scrollContainerRef.current.scrollWidth;
    }
  }, [weeks]);

  async function handleTogglePalette() {
    const next = activePalette === "diwali" ? "classic" : "diwali";
    setStoredPalette(next);
    if (onPaletteChange) {
      onPaletteChange(next);
    }
    await setHeatmapPalettePreference(next);
  }

  const isLoading =
    (weeklyLoading || yearlyLoading) &&
    !weeklyData &&
    !yearlyData &&
    !customDays &&
    !customContributions;

  if (isLoading) {
    return (
      <div className="rounded-lg border border-[#27272A] bg-[#0d1117] p-3 text-center">
        <p className="text-xs text-[#71717A]">Loading contribution graph...</p>
      </div>
    );
  }

  if (
    weeklyError &&
    !weeklyData &&
    !yearlyData &&
    !customDays &&
    !customContributions
  ) {
    return (
      <GitHubRateLimitMessage
        error={error}
        onRetry={() => {
          void refetchWeekly();
          void refetchYearly();
        }}
      />
    );
  }


  const paletteDef =
    activePalette === "diwali"
      ? DIWALI_HEATMAP_PALETTE
      : CLASSIC_HEATMAP_PALETTE;

  const displayTotal =
    yearlyData?.totalContributions && yearlyData.totalContributions > totalContributions
      ? yearlyData.totalContributions
      : totalContributions;

  const displayCurrentYear =
    currentYearContributions > 0 ? currentYearContributions : displayTotal;

  return (
    <section className="space-y-2">
      {/* Header showing Current Year Contributions like GitHub */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold text-[#FAFAFA] tracking-tight">
            {displayCurrentYear > 0
              ? `${displayCurrentYear.toLocaleString()} contributions in ${currentYear}`
              : `0 contributions in ${currentYear}`}
          </h2>

          <button
            type="button"
            onClick={handleTogglePalette}
            title={`Switch to ${activePalette === "diwali" ? "Classic" : "Diwali"
              } palette`}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors cursor-pointer border ${activePalette === "diwali"
                ? "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                : "border-zinc-700 bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700"
              }`}
          >
            {activePalette === "diwali" ? (
              <>
                <span className="text-xs">🪔</span>
                <span>Diwali Glow</span>
              </>
            ) : (
              <>
                <Sparkles size={10} className="text-emerald-400" />
                <span>Classic</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1 text-[11px] font-medium ${activePalette === "diwali" ? "text-amber-400" : "text-emerald-400"
              }`}
          >
          </div>
        </div>
      </div>

      {/* Main Heatmap Container matching GitHub's Look */}
      <div
        className={`rounded-lg border bg-[#0d1117] p-3 text-[#FAFAFA] transition-colors select-none ${activePalette === "diwali"
            ? "border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.05)]"
            : "border-[#27272A]"
          }`}
      >
        {/* Scrollable Graph Area */}
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto pb-2 scroll-smooth [scrollbar-width:thin] [scrollbar-color:#3f3f46_transparent]"
        >
          <div className="inline-block min-w-full">
            {/* Top Month Labels */}
            <div className="relative h-4 mb-1 pl-7 text-[10px] text-[#71717A]">
              {months.map((m) => (
                <span
                  key={`${m.colIndex}-${m.label}`}
                  className="absolute leading-none font-normal"
                  style={{ left: `${m.colIndex * 13 + 28}px` }}
                >
                  {m.label}
                </span>
              ))}
            </div>

            {/* Grid with Left Day-of-Week Labels */}
            <div className="flex items-start">
              {/* Day Labels Column (Mon, Wed, Fri) */}
              <div className="flex flex-col gap-[3px] pr-2 w-7 shrink-0 text-[9px] text-[#71717A] text-right font-normal leading-[10px]">
                <span className="h-[10px]" />
                <span className="h-[10px]">Mon</span>
                <span className="h-[10px]" />
                <span className="h-[10px]">Wed</span>
                <span className="h-[10px]" />
                <span className="h-[10px]">Fri</span>
                <span className="h-[10px]" />
              </div>

              {/* 52 Week Columns */}
              <div className="flex gap-[3px]">
                {weeks.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-[3px]">
                    {week.days.map((day) => {
                      if (day.isFuture) {
                        return (
                          <div
                            key={day.date}
                            className="h-[10px] w-[10px] opacity-0"
                          />
                        );
                      }

                      const intensity = getHeatmapIntensity(
                        day.count,
                        maxCount
                      );
                      const color = paletteDef[intensity];
                      const isHovered = hoveredDay?.date === day.date;

                      return (
                        <div
                          key={day.date}
                          role="gridcell"
                          aria-label={`${day.count === 0 ? "No" : day.count
                            } contributions on ${day.date}`}
                          onMouseEnter={() => setHoveredDay(day)}
                          onMouseLeave={() => setHoveredDay(null)}
                          className={`relative h-[10px] w-[10px] rounded-[2px] transition-transform duration-75 cursor-pointer ${color.bg
                            } ${color.border ? `border ${color.border}` : ""} ${color.glow || ""
                            } ${isHovered ? "scale-125 z-10 ring-1 ring-white" : ""}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Floating Tooltip / Year Summary info bar */}
        <div className="h-4 mt-1 px-1 text-[11px] text-[#A1A1AA] flex items-center">
          {hoveredDay ? (
            <span>
              <strong className="text-white font-semibold">
                {hoveredDay.count === 0 ? "No" : hoveredDay.count}{" "}
                contribution{hoveredDay.count === 1 ? "" : "s"}
              </strong>{" "}
              on {formatFullTooltipDate(hoveredDay.date)}
            </span>
          ) : (
            <span className="text-[10px] text-[#71717A]">
              {displayTotal > 0
                ? `${displayTotal.toLocaleString()} total contributions in the last year (${displayCurrentYear.toLocaleString()} in ${currentYear})`
                : `Showing ${currentYear} contributions`}
            </span>
          )}
        </div>

        {/* Footer matching GitHub */}
        <div className="mt-2 flex items-center justify-between border-t border-[#27272A]/80 pt-2 text-[10px] text-[#71717A]">
          <a
            href="https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile/managing-contribution-settings-on-your-profile/why-are-my-contributions-not-showing-up-on-my-profile"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#58a6ff] hover:underline transition-colors cursor-pointer"
          >
            Learn how we count contributions
          </a>

          {/* Intensity Key: Less [0, 1, 2, 3, 4] More */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px]">Less</span>
            {([0, 1, 2, 3, 4] as const).map((level) => {
              const c = paletteDef[level];
              return (
                <div
                  key={level}
                  className={`h-[10px] w-[10px] rounded-[2px] ${c.bg} ${c.border ? `border ${c.border}` : ""
                    }`}
                  title={`Level ${level}`}
                />
              );
            })}
            <span className="text-[9px]">More</span>
          </div>
        </div>
      </div>
    </section>
  );
}
