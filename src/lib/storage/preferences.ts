/**
 * Solohub User Preferences Storage
 *
 * Persists client-side UI preferences such as contribution heatmap palette and application theme.
 */

const PREFERENCES_STORAGE_KEY = "solohub_preferences";

export type HeatmapPalettePreference = "diwali" | "classic";
export type AppTheme = "diwali" | "dark";

export interface UserPreferences {
  heatmapPalette: HeatmapPalettePreference;
  theme: AppTheme;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  heatmapPalette: "diwali",
  theme: "diwali",
};

export async function getUserPreferences(): Promise<UserPreferences> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return DEFAULT_PREFERENCES;
  }

  try {
    const result = await chrome.storage.local.get({
      [PREFERENCES_STORAGE_KEY]: DEFAULT_PREFERENCES,
    });
    return {
      ...DEFAULT_PREFERENCES,
      ...((result[PREFERENCES_STORAGE_KEY] as Partial<UserPreferences>) || {}),
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export async function setThemePreference(theme: AppTheme): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return;
  }

  try {
    const current = await getUserPreferences();
    await chrome.storage.local.set({
      [PREFERENCES_STORAGE_KEY]: {
        ...current,
        theme,
      },
    });
  } catch (err) {
    console.warn("Failed to persist theme preference:", err);
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
