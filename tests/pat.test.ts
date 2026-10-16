import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { getGitHubUser, GitHubApiError } from "../src/lib/github/client.js";
import { getAuth, setAuth, clearAuth } from "../src/lib/storage/auth.js";

describe("PAT-First Authentication & Storage Tests", () => {
  const originalChrome = globalThis.chrome;
  const originalFetch = globalThis.fetch;
  const originalEnv = { ...process.env };

  let storageData: Record<string, unknown> = {};

  beforeEach(() => {
    storageData = {};

    // Mock chrome global with in-memory storage
    (globalThis as unknown as { chrome: unknown }).chrome = {
      storage: {
        local: {
          get: async (keys?: unknown) => {
            if (typeof keys === "object" && keys !== null) {
              const res: Record<string, unknown> = {};
              for (const [k, defaultVal] of Object.entries(keys as Record<string, unknown>)) {
                res[k] = storageData[k] !== undefined ? storageData[k] : defaultVal;
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

    // Remove backend configuration to verify PAT has zero backend dependency
    delete process.env.VITE_BACKEND_URL;
    delete process.env.VITE_GITHUB_CLIENT_ID;
  });

  afterEach(() => {
    (globalThis as unknown as { chrome: unknown }).chrome = originalChrome;
    globalThis.fetch = originalFetch;
    process.env = { ...originalEnv };
  });

  it("PAT authentication operates entirely without VITE_BACKEND_URL or OAuth credentials", async () => {
    assert.equal(process.env.VITE_BACKEND_URL, undefined);
    assert.equal(process.env.VITE_GITHUB_CLIENT_ID, undefined);

    let backendCalled = false;
    let githubApiCalled = false;
    let authHeaderSent = "";

    globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
      const urlStr = url.toString();

      if (urlStr.includes("localhost") || urlStr.includes("auth/github")) {
        backendCalled = true;
        throw new Error("Backend was unexpectedly contacted during PAT flow");
      }

      if (urlStr === "https://api.github.com/user") {
        githubApiCalled = true;
        const headers = new Headers(init?.headers);
        authHeaderSent = headers.get("Authorization") || "";

        return {
          ok: true,
          status: 200,
          headers: new Headers({
            "content-type": "application/json",
            "x-ratelimit-remaining": "4999",
          }),
          json: async () => ({
            id: 12345,
            login: "solo-maintainer",
            name: "Solo Developer",
            avatar_url: "https://avatars.githubusercontent.com/u/12345",
            html_url: "https://github.com/solo-maintainer",
          }),
        } as unknown as Response;
      }

      throw new Error(`Unexpected request to: ${urlStr}`);
    }) as typeof fetch;

    const mockPat = "ghp_mockPersonalAccessToken1234567890";

    // 1. Validate PAT directly against GitHub API
    const user = await getGitHubUser(mockPat);

    assert.equal(user.login, "solo-maintainer");
    assert.equal(githubApiCalled, true);
    assert.equal(backendCalled, false, "Must never contact the backend during PAT authentication");
    assert.equal(authHeaderSent, `Bearer ${mockPat}`);

    // 2. Persist PAT authentication
    await setAuth(mockPat, user);

    // 3. Verify retrieved auth
    const saved = await getAuth();
    assert.ok(saved);
    assert.equal(saved.token, mockPat);
    assert.equal(saved.user.login, "solo-maintainer");
  });

  it("safely handles invalid or expired PAT with 401 Unauthorized", async () => {
    globalThis.fetch = (async () => {
      return {
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        headers: new Headers(),
        json: async () => ({
          message: "Bad credentials",
          documentation_url: "https://docs.github.com/rest",
        }),
      } as unknown as Response;
    }) as typeof fetch;

    await assert.rejects(
      () => getGitHubUser("ghp_expiredOrInvalidToken"),
      (err: unknown) => {
        assert.ok(err instanceof GitHubApiError);
        assert.equal(err.status, 401);
        assert.equal(err.message, "Bad credentials");
        return true;
      }
    );
  });

  it("logout completely clears authentication state from storage", async () => {
    const mockUser = {
      id: 99,
      login: "test-user",
      name: "Tester",
      avatar_url: "",
      html_url: "https://github.com/test-user",
    };

    await setAuth("ghp_active_token", mockUser);
    let currentAuth = await getAuth();
    assert.ok(currentAuth);
    assert.equal(currentAuth.token, "ghp_active_token");

    // Perform disconnect / logout
    await clearAuth();

    currentAuth = await getAuth();
    assert.equal(currentAuth, null, "Storage must be null after logout");
  });
});
