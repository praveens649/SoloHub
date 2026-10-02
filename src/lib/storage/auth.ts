import type { GitHubUser } from "../github/types";

const AUTH_STORAGE_KEY = "github_auth";

interface StoredAuth {
  token: string;
  user: GitHubUser;
}

export async function getAuth(): Promise<StoredAuth | null> {
  const result = await chrome.storage.local.get({
    [AUTH_STORAGE_KEY]: null as StoredAuth | null,
  });

  return result[AUTH_STORAGE_KEY] as StoredAuth | null;
}

export async function setAuth(
  token: string,
  user: GitHubUser
) {
  await chrome.storage.local.set({
    [AUTH_STORAGE_KEY]: {
      token,
      user,
    },
  });
}

export async function clearAuth() {
  await chrome.storage.local.remove(AUTH_STORAGE_KEY);
}