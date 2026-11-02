/**
 * Solohub User Preferences Storage
 *
 * Persists client-side UI preferences such as contribution heatmap palette.
 */

const PREFERENCES_STORAGE_KEY = "solohub_preferences";

export type HeatmapPalettePreference = "diwali" | "classic";

export interface UserPreferences {
  heatmapPalette: HeatmapPalettePreference;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  heatmapPalette: "diwali",
};

export async function getUserPreferences(): Promise<UserPreferences> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return DEFAULT_PREFERENCES;
  }

  try {
    const result = await chrome.storage.local.get({
      [PREFERENCES_STORAGE_KEY]: DEFAULT_PREFERENCES,
    });
    return (result[PREFERENCES_STORAGE_KEY] as UserPreferences) || DEFAULT_PREFERENCES;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export async function setHeatmapPalettePreference(
  palette: HeatmapPalettePreference
): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return;
  }

  try {
    const current = await getUserPreferences();
    await chrome.storage.local.set({
      [PREFERENCES_STORAGE_KEY]: {
        ...current,
        heatmapPalette: palette,
      },
    });
  } catch (err) {
    console.warn("Failed to persist heatmap palette preference:", err);
  }
}

