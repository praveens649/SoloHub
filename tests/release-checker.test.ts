import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  compareSemver,
  isNewerVersion,
  fetchLatestRelease,
  getReleaseRepoCoordinates,
  type GitHubRelease,
} from "../src/lib/github/releases.ts";
import {
  getCachedReleaseCheck,
  setCachedReleaseCheck,
  isReleaseDismissed,
  dismissRelease,
  postponeRelease,
  clearReleaseDismissals,
} from "../src/lib/storage/releases.ts";

describe("Solohub Release Update Checker Tests", () => {
  const originalChrome = (globalThis as Record<string, unknown>).chrome;
  const originalFetch = globalThis.fetch;
  const originalEnv = { ...process.env };
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
      runtime: {
        getManifest: () => ({ version: "0.1.0" }),
      },
    };
  });

  afterEach(() => {
    (globalThis as unknown as { chrome: unknown }).chrome = originalChrome;
    globalThis.fetch = originalFetch;
    process.env = { ...originalEnv };
  });

  describe("Semantic Version Comparison", () => {
    it("correctly compares semver releases", () => {
      // Direct version increments
      assert.equal(compareSemver("0.2.0", "0.1.0"), 1);
      assert.equal(compareSemver("0.1.0", "0.1.0"), 0);
      assert.equal(compareSemver("0.1.0", "0.2.0"), -1);

      // Version with 'v' prefix
      assert.equal(compareSemver("v0.2.0", "0.1.0"), 1);
      assert.equal(compareSemver("v0.1.0", "v0.1.0"), 0);

      // Patch versions
      assert.equal(compareSemver("0.1.1", "0.1.0"), 1);
      assert.equal(compareSemver("0.1.0", "0.1.1"), -1);

      // Major versions
      assert.equal(compareSemver("1.0.0", "0.9.9"), 1);

      // Prerelease comparison: standard release is higher than prerelease with same core
      assert.equal(compareSemver("0.2.0", "0.2.0-beta.1"), 1);
      assert.equal(compareSemver("0.2.0-beta.1", "0.1.0"), 1);
    });

    it("evaluates isNewerVersion accurately", () => {
      assert.equal(isNewerVersion("0.2.0", "0.1.0"), true);
      assert.equal(isNewerVersion("v0.2.0", "0.1.0"), true);
      assert.equal(isNewerVersion("0.1.0", "0.1.0"), false);
      assert.equal(isNewerVersion("0.0.9", "0.1.0"), false);
      assert.equal(isNewerVersion("v0.1.0", "0.1.0"), false);
    });

    it("discovers repository coordinates from project configuration", () => {
      const coords = getReleaseRepoCoordinates();
      assert.equal(coords.owner, "praveens649");
      assert.equal(coords.repo, "SoloHub");
    });
  });

  describe("GitHub Releases API Integration", () => {
    it("detects when a new release is available", async () => {
      const mockRelease: GitHubRelease = {
        id: 12345,
        tag_name: "v0.2.0",
        name: "Solohub Diwali Update",
        body: "A little light. A lot more productivity. 🪔",
        html_url: "https://github.com/praveens649/SoloHub/releases/tag/v0.2.0",
        published_at: "2026-11-02T12:00:00Z",
        draft: false,
        prerelease: false,
      };

      globalThis.fetch = (async (url: string | URL) => {
        const urlStr = url.toString();
        assert.ok(urlStr.includes("repos/praveens649/SoloHub/releases/latest"));

        return {
          ok: true,
          status: 200,
          headers: new Headers({
            "content-type": "application/json",
            "x-ratelimit-remaining": "4999",
          }),
          json: async () => mockRelease,
        } as unknown as Response;
      }) as typeof fetch;

      const result = await fetchLatestRelease("mock_pat_token");

      assert.equal(result.rateLimited, false);
      assert.ok(result.release);
      assert.equal(result.release.tag_name, "v0.2.0");
      assert.equal(isNewerVersion(result.release.tag_name, "0.1.0"), true);
    });

    it("returns null when no update is available (release is draft or prerelease)", async () => {
      // Draft release
      globalThis.fetch = (async () => {
        return {
          ok: true,
          status: 200,
          headers: new Headers({ "x-ratelimit-remaining": "5000" }),
          json: async () => ({
            id: 1,
            tag_name: "v0.3.0",
            draft: true,
            prerelease: false,
          }),
        } as unknown as Response;
      }) as typeof fetch;

      const draftResult = await fetchLatestRelease();
      assert.equal(draftResult.release, null, "Draft releases must be ignored");

      // Prerelease
      globalThis.fetch = (async () => {
        return {
          ok: true,
          status: 200,
          headers: new Headers({ "x-ratelimit-remaining": "5000" }),
          json: async () => ({
            id: 2,
            tag_name: "v0.3.0-rc.1",
            draft: false,
            prerelease: true,
          }),
        } as unknown as Response;
      }) as typeof fetch;

      const preResult = await fetchLatestRelease();
      assert.equal(preResult.release, null, "Prereleases must be ignored by default");
    });

    it("handles GitHub rate limit failures gracefully without crashing", async () => {
      globalThis.fetch = (async () => {
        return {
          ok: false,
          status: 403,
          statusText: "Forbidden",
          headers: new Headers({
            "x-ratelimit-remaining": "0",
          }),
          json: async () => ({
            message: "API rate limit exceeded for IP.",
          }),
        } as unknown as Response;
      }) as typeof fetch;

      const result = await fetchLatestRelease();
      assert.equal(result.release, null);
      assert.equal(result.rateLimited, true);
      assert.ok(result.error?.includes("rate limit"));
    });

    it("handles missing network connectivity gracefully", async () => {
      globalThis.fetch = (async () => {
        throw new TypeError("Failed to fetch");
      }) as typeof fetch;

      const result = await fetchLatestRelease();
      assert.equal(result.release, null);
      assert.equal(result.rateLimited, false);
      assert.equal(result.error, "Failed to fetch");
    });

    it("handles 404 (no releases found) cleanly", async () => {
      globalThis.fetch = (async () => {
        return {
          ok: false,
          status: 404,
          statusText: "Not Found",
          headers: new Headers({}),
        } as unknown as Response;
      }) as typeof fetch;

      const result = await fetchLatestRelease();
      assert.equal(result.release, null);
      assert.equal(result.rateLimited, false);
    });
  });

  describe("Caching & Dismissed Release Behavior", () => {
    it("caches release check results in storage", async () => {
      const initialCache = await getCachedReleaseCheck();
      assert.equal(initialCache, null);

      const mockRelease: GitHubRelease = {
        id: 99,
        tag_name: "v0.2.0",
        name: "Diwali Update",
        body: "Notes",
        html_url: "https://github.com/praveens649/SoloHub/releases",
        published_at: "2026-11-02",
        draft: false,
        prerelease: false,
      };

      await setCachedReleaseCheck(mockRelease);

      const cached = await getCachedReleaseCheck();
      assert.ok(cached);
      assert.equal(cached.release?.tag_name, "v0.2.0");
      assert.ok(Date.now() - cached.lastChecked < 1000);
    });

    it("remembers dismissed releases and prevents repeated announcements", async () => {
      // 1. Initial release is not dismissed
      assert.equal(await isReleaseDismissed("v0.2.0"), false);

      // 2. User clicks Dismiss
      await dismissRelease("v0.2.0");
      assert.equal(await isReleaseDismissed("v0.2.0"), true);

      // 3. A subsequent new version (v0.3.0) is NOT dismissed
      assert.equal(await isReleaseDismissed("v0.3.0"), false);
    });

    it("remembers postponed releases for specified duration", async () => {
      // Postpone for 24 hours
      await postponeRelease("v0.2.0", 24);
      assert.equal(await isReleaseDismissed("v0.2.0"), true);

      // Clear dismissals
      await clearReleaseDismissals();
      assert.equal(await isReleaseDismissed("v0.2.0"), false);
    });
  });

  describe("PAT-Only Operation Without Backend", () => {
    it("checks releases directly via GitHub API without contacting backend", async () => {
      let backendContacted = false;
      let githubApiContacted = false;

      globalThis.fetch = (async (url: string | URL) => {
        const urlStr = url.toString();
        if (urlStr.includes("localhost") || urlStr.includes("auth")) {
          backendContacted = true;
          throw new Error("Backend contacted!");
        }

        if (urlStr.includes("api.github.com/repos/praveens649/SoloHub/releases/latest")) {
          githubApiContacted = true;
          return {
            ok: true,
            status: 200,
            headers: new Headers({ "x-ratelimit-remaining": "5000" }),
            json: async () => ({
              id: 1,
              tag_name: "v0.2.0",
              draft: false,
              prerelease: false,
              html_url: "https://github.com/praveens649/SoloHub/releases/tag/v0.2.0",
            }),
          } as unknown as Response;
        }

        throw new Error(`Unexpected request: ${urlStr}`);
      }) as typeof fetch;

      const result = await fetchLatestRelease("ghp_test_pat");

      assert.equal(githubApiContacted, true);
      assert.equal(backendContacted, false, "Must never contact backend for release check");
      assert.equal(result.release?.tag_name, "v0.2.0");
    });
  });
});

