import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  getHeatmapIntensity,
  DIWALI_HEATMAP_PALETTE,
  CLASSIC_HEATMAP_PALETTE,
  buildYearContributionGrid,
} from "../src/popup/components/ContributionHeatmapPalette.ts";
import {
  getUserPreferences,
  setHeatmapPalettePreference,
} from "../src/lib/storage/preferences.ts";

describe("Contribution Heatmap & Seasonal Palette Tests", () => {
  const originalChrome = (globalThis as Record<string, unknown>).chrome;
  let storageData: Record<string, unknown> = {};

  beforeEach(() => {
    storageData = {};
    (globalThis as unknown as { chrome: unknown }).chrome = {
      storage: {
        local: {
          get: async (keys?: unknown) => {
            if (typeof keys === "object" && keys !== null) {
              const res: Record<string, unknown> = {};
              for (const [k, defaultVal] of Object.entries(
                keys as Record<string, unknown>
              )) {
                res[k] =
                  storageData[k] !== undefined ? storageData[k] : defaultVal;
              }
              return res;
            }
            return { ...storageData };
          },
          set: async (items: Record<string, unknown>) => {
            Object.assign(storageData, items);
          },
          remove: async (key: string) => {
            delete storageData[key];
          },
        },
      },
    };
  });

  afterEach(() => {
    (globalThis as unknown as { chrome: unknown }).chrome = originalChrome;
  });

  it("calculates heatmap intensity levels accurately across 5 levels (0-4)", () => {
    // 0 commits -> Level 0
    assert.equal(getHeatmapIntensity(0, 10), 0);
    assert.equal(getHeatmapIntensity(-1, 10), 0);

    // 1-25% -> Level 1
    assert.equal(getHeatmapIntensity(1, 10), 1);
    assert.equal(getHeatmapIntensity(2, 10), 1);

    // 26-50% -> Level 2
    assert.equal(getHeatmapIntensity(3, 10), 2);
    assert.equal(getHeatmapIntensity(5, 10), 2);

    // 51-75% -> Level 3
    assert.equal(getHeatmapIntensity(6, 10), 3);
    assert.equal(getHeatmapIntensity(7, 10), 3);

    // >75% -> Level 4
    assert.equal(getHeatmapIntensity(8, 10), 4);
    assert.equal(getHeatmapIntensity(10, 10), 4);

    // Single commit with maxCommits = 1 gives max intensity (Level 4)
    assert.equal(getHeatmapIntensity(1, 1), 4);
  });

  it("provides seasonal Diwali palette with saffron, amber, and gold shades", () => {
    assert.ok(DIWALI_HEATMAP_PALETTE[0]);
    assert.ok(DIWALI_HEATMAP_PALETTE[1]);
    assert.ok(DIWALI_HEATMAP_PALETTE[2]);
    assert.ok(DIWALI_HEATMAP_PALETTE[3]);
    assert.ok(DIWALI_HEATMAP_PALETTE[4]);

    // Check Diwali palette tones
    assert.equal(DIWALI_HEATMAP_PALETTE[1].hex, "#7C2D12", "Level 1 is amber rust");
    assert.equal(DIWALI_HEATMAP_PALETTE[2].hex, "#EA580C", "Level 2 is saffron");
    assert.equal(DIWALI_HEATMAP_PALETTE[3].hex, "#F59E0B", "Level 3 is radiant amber");
    assert.equal(DIWALI_HEATMAP_PALETTE[4].hex, "#FACC15", "Level 4 is festive gold");
    assert.ok(DIWALI_HEATMAP_PALETTE[4].glow, "Level 4 must have a radiant glow");
  });

  it("provides classic GitHub green palette matching the authentic layout", () => {
    assert.ok(CLASSIC_HEATMAP_PALETTE[0]);
    assert.ok(CLASSIC_HEATMAP_PALETTE[1]);
    assert.ok(CLASSIC_HEATMAP_PALETTE[2]);
    assert.ok(CLASSIC_HEATMAP_PALETTE[3]);
    assert.ok(CLASSIC_HEATMAP_PALETTE[4]);

    assert.equal(CLASSIC_HEATMAP_PALETTE[0].hex, "#161b22");
    assert.equal(CLASSIC_HEATMAP_PALETTE[1].hex, "#0e4429");
    assert.equal(CLASSIC_HEATMAP_PALETTE[2].hex, "#006d32");
    assert.equal(CLASSIC_HEATMAP_PALETTE[3].hex, "#26a641");
    assert.equal(CLASSIC_HEATMAP_PALETTE[4].hex, "#39d353");
  });

  it("generates a 52-week GitHub calendar grid and computes current-year contributions", () => {
    const refDate = new Date("2026-11-02"); // Year 2026
    const activityMap = new Map<string, number>([
      ["2026-11-02", 5],
      ["2026-10-15", 3],
      ["2025-12-10", 10], // Previous calendar year within the trailing 52 weeks
    ]);

    const {
      weeks,
      months,
      maxCount,
      totalContributions,
      currentYearContributions,
      currentYear,
    } = buildYearContributionGrid(refDate, activityMap);

    // 52 weeks
    assert.equal(weeks.length, 52);

    // Each week has 7 days (Sun through Sat)
    for (const week of weeks) {
      assert.equal(week.days.length, 7);
      assert.equal(week.days[0].dayOfWeek, 0); // Sunday
      assert.equal(week.days[1].dayOfWeek, 1); // Monday
      assert.equal(week.days[6].dayOfWeek, 6); // Saturday
    }

    // Month headers exist and span the year
    assert.ok(months.length >= 12, "Must contain at least 12 month label checkpoints");

    // Total vs current-year contributions
    assert.equal(currentYear, 2026);
    assert.equal(totalContributions, 18); // 5 + 3 + 10
    assert.equal(currentYearContributions, 8); // only 2026-11-02 and 2026-10-15
    assert.equal(maxCount, 10);
  });

  it("defaults user preference to Diwali palette and persists changes in storage", async () => {
    // 1. Initial default is Diwali
    const initialPrefs = await getUserPreferences();
    assert.equal(initialPrefs.heatmapPalette, "diwali");

    // 2. Set to classic
    await setHeatmapPalettePreference("classic");
    const updatedPrefs = await getUserPreferences();
    assert.equal(updatedPrefs.heatmapPalette, "classic");

    // 3. Switch back to Diwali
    await setHeatmapPalettePreference("diwali");
    const finalPrefs = await getUserPreferences();
    assert.equal(finalPrefs.heatmapPalette, "diwali");
  });
});
