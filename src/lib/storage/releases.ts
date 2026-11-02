/**
 * Solohub Release Storage
 *
 * Persists release check caching and user dismissal/postponement choices
 * in chrome.storage.local.
 */

import type { GitHubRelease } from "../github/releases";

const RELEASE_CACHE_KEY = "solohub_release_cache";
const RELEASE_DISMISSED_KEY = "solohub_release_dismissals";

export interface StoredReleaseCache {
  lastChecked: number;
  release: GitHubRelease | null;
}

export interface StoredDismissal {
  dismissed: boolean;
  dismissedAt: number;
  postponedUntil?: number;
}

export type DismissedStore = Record<string, StoredDismissal>;

/**
 * 4 hours default cache TTL to prevent hitting GitHub API rate limits.
 */
export const RELEASE_CACHE_TTL_MS = 4 * 60 * 60 * 1000;

export async function getCachedReleaseCheck(): Promise<StoredReleaseCache | null> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return null;
  }

  try {
    const result = await chrome.storage.local.get({
      [RELEASE_CACHE_KEY]: null as StoredReleaseCache | null,
    });
    return (result[RELEASE_CACHE_KEY] as StoredReleaseCache | null) || null;
  } catch {
    return null;
  }
}

export async function setCachedReleaseCheck(
  release: GitHubRelease | null
): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return;
  }

  try {
    await chrome.storage.local.set({
      [RELEASE_CACHE_KEY]: {
        lastChecked: Date.now(),
        release,
      },
    });
  } catch (err) {
    console.warn("Failed to set release check cache:", err);
  }
}

export async function getDismissedReleases(): Promise<DismissedStore> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return {};
  }

  try {
    const result = await chrome.storage.local.get({
      [RELEASE_DISMISSED_KEY]: {} as DismissedStore,
    });
    return (result[RELEASE_DISMISSED_KEY] as DismissedStore) || {};
  } catch {
    return {};
  }
}

export async function isReleaseDismissed(version: string): Promise<boolean> {
  const store = await getDismissedReleases();
  const entry = store[version];
  if (!entry) return false;

  // If permanently dismissed
  if (entry.dismissed) return true;

  // If postponed and current time is before postponedUntil
  if (entry.postponedUntil && Date.now() < entry.postponedUntil) {
    return true;
  }

  return false;
}

export async function dismissRelease(version: string): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return;
  }

  try {
    const store = await getDismissedReleases();
    store[version] = {
      dismissed: true,
      dismissedAt: Date.now(),
    };
    await chrome.storage.local.set({
      [RELEASE_DISMISSED_KEY]: store,
    });
  } catch (err) {
    console.warn("Failed to dismiss release:", err);
  }
}

export async function postponeRelease(
  version: string,
  hours = 24
): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return;
  }

  try {
    const store = await getDismissedReleases();
    store[version] = {
      dismissed: false,
      dismissedAt: Date.now(),
      postponedUntil: Date.now() + hours * 60 * 60 * 1000,
    };
    await chrome.storage.local.set({
      [RELEASE_DISMISSED_KEY]: store,
    });
  } catch (err) {
    console.warn("Failed to postpone release:", err);
  }
}

export async function clearReleaseDismissals(): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return;
  }

  try {
    await chrome.storage.local.remove(RELEASE_DISMISSED_KEY);
  } catch (err) {
    console.warn("Failed to clear release dismissals:", err);
  }
}

