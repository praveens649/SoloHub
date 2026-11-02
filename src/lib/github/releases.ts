/**
 * Solohub Release Update Service
 *
 * Checks GitHub Releases API for new Solohub releases.
 * Compares versions using semantic versioning.
 * Strictly avoids silent auto-updates; reports release notes and links for manual update.
 */

export interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string | null;
  body: string | null;
  html_url: string;
  published_at: string | null;
  draft: boolean;
  prerelease: boolean;
}

export interface ReleaseCheckResult {
  hasUpdate: boolean;
  installedVersion: string;
  latestVersion: string;
  release: GitHubRelease | null;
  rateLimited?: boolean;
  error?: string;
}

/**
 * Discovered default repository coordinates for Solohub.
 * Can be overridden via environment variables if needed.
 */
export function getReleaseRepoCoordinates(): { owner: string; repo: string } {
  let envSource: Record<string, unknown> = {};
  if (
    typeof import.meta !== "undefined" &&
    typeof (import.meta as { env?: unknown }).env === "object" &&
    (import.meta as { env?: unknown }).env !== null
  ) {
    envSource = (import.meta as { env: Record<string, unknown> }).env;
  } else {
    const globalProc = (
      globalThis as unknown as { process?: { env?: Record<string, unknown> } }
    ).process;
    if (
      globalProc &&
      typeof globalProc.env === "object" &&
      globalProc.env !== null
    ) {
      envSource = globalProc.env;
    }
  }

  const owner =
    (envSource.VITE_RELEASE_REPO_OWNER as string | undefined)?.trim() ||
    "praveens649";
  const repo =
    (envSource.VITE_RELEASE_REPO_NAME as string | undefined)?.trim() ||
    "SoloHub";

  return { owner, repo };
}

/**
 * Normalizes a semver string (e.g. "v0.2.0" -> "0.2.0").
 */
export function normalizeVersion(version: string): string {
  if (!version || typeof version !== "string") return "0.0.0";
  return version.trim().replace(/^[vV]/, "");
}

/**
 * Compares two semantic version strings.
 * Returns:
 *   1 if v1 > v2
 *  -1 if v1 < v2
 *   0 if v1 === v2
 */
export function compareSemver(v1: string, v2: string): number {
  const norm1 = normalizeVersion(v1);
  const norm2 = normalizeVersion(v2);

  // Split prerelease metadata (e.g., "0.2.0-beta.1" -> core "0.2.0", pre "beta.1")
  const [core1, pre1] = norm1.split("-");
  const [core2, pre2] = norm2.split("-");

  const parts1 = core1.split(".").map((p) => parseInt(p, 10) || 0);
  const parts2 = core2.split(".").map((p) => parseInt(p, 10) || 0);

  // Pad to at least 3 parts (major, minor, patch)
  while (parts1.length < 3) parts1.push(0);
  while (parts2.length < 3) parts2.push(0);

  for (let i = 0; i < 3; i++) {
    if (parts1[i] > parts2[i]) return 1;
    if (parts1[i] < parts2[i]) return -1;
  }

  // If core versions match, standard semver specifies:
  // A version without prerelease has higher precedence than one with prerelease:
  // e.g. 0.2.0 > 0.2.0-beta.1
  if (!pre1 && pre2) return 1;
  if (pre1 && !pre2) return -1;
  if (pre1 && pre2) {
    if (pre1 > pre2) return 1;
    if (pre1 < pre2) return -1;
  }

  return 0;
}

/**
 * Returns true if remoteVersion is strictly newer than installedVersion.
 */
export function isNewerVersion(
  remoteVersion: string,
  installedVersion: string
): boolean {
  return compareSemver(remoteVersion, installedVersion) > 0;
}

/**
 * Retrieves the currently installed Solohub extension version.
 */
export function getInstalledVersion(): string {
  if (
    typeof chrome !== "undefined" &&
    chrome.runtime &&
    typeof chrome.runtime.getManifest === "function"
  ) {
    try {
      const manifest = chrome.runtime.getManifest();
      if (manifest?.version) {
        return manifest.version;
      }
    } catch {
      // Fallback
    }
  }

  return "0.1.0";
}

/**
 * Fetches the latest published release from the GitHub Releases API.
 * Respects rate limits, drafts, and prereleases.
 */
export async function fetchLatestRelease(
  token?: string | null,
  options: {
    owner?: string;
    repo?: string;
    allowPrerelease?: boolean;
  } = {}
): Promise<{ release: GitHubRelease | null; rateLimited: boolean; error?: string }> {
  const coords = getReleaseRepoCoordinates();
  const owner = options.owner || coords.owner;
  const repo = options.repo || coords.repo;

  const url = `https://api.github.com/repos/${encodeURIComponent(
    owner
  )}/${encodeURIComponent(repo)}/releases/latest`;

  const headers = new Headers();
  headers.set("Accept", "application/vnd.github+json");
  headers.set("X-GitHub-Api-Version", "2022-11-28");

  if (token && token.trim()) {
    headers.set("Authorization", `Bearer ${token.trim()}`);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers,
    });
  } catch (err) {
    return {
      release: null,
      rateLimited: false,
      error: err instanceof Error ? err.message : "Network error fetching release",
    };
  }

  const remaining = response.headers.get("x-ratelimit-remaining");
  const isRateLimited =
    response.status === 403 &&
    (remaining === "0" || response.statusText.toLowerCase().includes("rate limit"));

  if (isRateLimited) {
    return {
      release: null,
      rateLimited: true,
      error: "GitHub API rate limit exceeded.",
    };
  }

  if (response.status === 404) {
    // No published releases found for this repository yet
    return {
      release: null,
      rateLimited: false,
    };
  }

  if (!response.ok) {
    return {
      release: null,
      rateLimited: false,
      error: `GitHub API error: ${response.status} ${response.statusText}`,
    };
  }

  try {
    const data = (await response.json()) as GitHubRelease;

    // Filter out drafts and prereleases unless configured
    if (data.draft) {
      return { release: null, rateLimited: false };
    }

    if (data.prerelease && !options.allowPrerelease) {
      return { release: null, rateLimited: false };
    }

    return { release: data, rateLimited: false };
  } catch (err) {
    return {
      release: null,
      rateLimited: false,
      error: err instanceof Error ? err.message : "Failed to parse release data",
    };
  }
}
