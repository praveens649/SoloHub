/**
 * Solohub Authentication Storage
 *
 * SECURITY NOTICE:
 * Tokens are stored using chrome.storage.local, which is sandboxed per-extension
 * by Chrome, but is NOT encrypted at rest on the user's filesystem.
 *
 * This persistence is necessary to preserve the authenticated state across popup
 * open/close cycles and service worker restarts. Users operating on shared, untrusted,
 * or public workstations should explicitly disconnect to remove stored credentials.
 */

import type { GitHubUser } from "../github/types";

const AUTH_STORAGE_KEY = "github_auth";

export interface StoredAuth {
  token: string;
  user: GitHubUser;
}

export async function getAuth(): Promise<StoredAuth | null> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return null;
  }

  const result = await chrome.storage.local.get({
    [AUTH_STORAGE_KEY]: null as StoredAuth | null,
  });

  return (result[AUTH_STORAGE_KEY] as StoredAuth | null) || null;
}

export async function setAuth(
  token: string,
  user: GitHubUser
): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    throw new Error("chrome.storage.local is unavailable.");
  }

  await chrome.storage.local.set({
    [AUTH_STORAGE_KEY]: {
      token,
      user,
    },
  });
}

export async function clearAuth(): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return;
  }

  await chrome.storage.local.remove(AUTH_STORAGE_KEY);
}