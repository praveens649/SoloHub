import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { loginWithGitHub } from "../src/lib/github/auth.js";

describe("OAuth Authentication Flow (auth.ts)", () => {
  const originalChrome = (globalThis as Record<string, unknown>).chrome;
  const originalFetch = globalThis.fetch;

  let storageRemovedKey: string | null = null;

  beforeEach(() => {
    storageRemovedKey = null;

    // Mock chrome global
    (globalThis as unknown as { chrome: unknown }).chrome = {
      identity: {
        getRedirectURL: () => "https://abcdefghijklmnopqrstuvwxyz123456.chromiumapp.org/",
        launchWebAuthFlow: async () => {
          return "https://abcdefghijklmnopqrstuvwxyz123456.chromiumapp.org/?code=valid_code_123&state=backend_issued_state_token_xyz";
        },
      },
      storage: {
        local: {
          get: async () => ({}),
          set: async () => {},
          remove: async (key: string) => {
            storageRemovedKey = key;
          },
        },
      },
    };

    // Set development environment variables for tests
    process.env.VITE_GITHUB_CLIENT_ID = "test_client_id";
    process.env.VITE_BACKEND_URL = "http://localhost:3001";
  });

  afterEach(() => {
    (globalThis as unknown as { chrome: unknown }).chrome = originalChrome;
    globalThis.fetch = originalFetch;
  });

  it("completes full OAuth flow with backend-coordinated state", async () => {
    let stateEndpointCalled = false;
    let exchangePayload: Record<string, unknown> | null = null;
    let userChecked = false;

    globalThis.fetch = (async (url: string, init?: RequestInit) => {
      const urlStr = url.toString();

      if (urlStr.includes("/auth/github/state")) {
        stateEndpointCalled = true;
        return {
          ok: true,
          status: 200,
          json: async () => ({ state: "backend_issued_state_token_xyz" }),
        } as unknown as Response;
      }

      if (urlStr.includes("/auth/github/exchange")) {
        exchangePayload = JSON.parse(init?.body as string);
        return {
          ok: true,
          status: 200,
          json: async () => ({ access_token: "gho_valid_oauth_token" }),
        } as unknown as Response;
      }

      if (urlStr.includes("api.github.com/user")) {
        userChecked = true;
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({ id: 1, login: "solodev" }),
        } as unknown as Response;
      }

      throw new Error(`Unexpected fetch URL in test: ${urlStr}`);
    }) as typeof fetch;

    const token = await loginWithGitHub();

    assert.equal(token, "gho_valid_oauth_token");
    assert.equal(stateEndpointCalled, true);
    assert.equal(userChecked, true);
    assert.deepEqual(exchangePayload, {
      code: "valid_code_123",
      redirect_uri: "https://abcdefghijklmnopqrstuvwxyz123456.chromiumapp.org/",
      state: "backend_issued_state_token_xyz",
    });
  });

  it("rejects login when callback state does not match backend-issued state", async () => {
    (globalThis as unknown as { chrome: unknown }).chrome = {
      identity: {
        getRedirectURL: () => "https://abcdefghijklmnopqrstuvwxyz123456.chromiumapp.org/",
        launchWebAuthFlow: async () => {
          // Attacker returned forged or mismatched state
          return "https://abcdefghijklmnopqrstuvwxyz123456.chromiumapp.org/?code=some_code&state=forged_state_attacker";
        },
      },
      storage: {
        local: {
          get: async () => ({}),
          set: async () => {},
          remove: async (key: string) => {
            storageRemovedKey = key;
          },
        },
      },
    };

    globalThis.fetch = (async (url: string) => {
      if (url.toString().includes("/auth/github/state")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ state: "legitimate_backend_state_12345678" }),
        } as unknown as Response;
      }
      throw new Error("Should not reach exchange on state mismatch");
    }) as typeof fetch;

    await assert.rejects(
      () => loginWithGitHub(),
      /OAuth state mismatch/
    );

    // Verify storage was cleared to prevent partial auth state
    assert.equal(storageRemovedKey, "github_auth");
  });

  it("handles user cancellation gracefully", async () => {
    (globalThis as unknown as { chrome: unknown }).chrome = {
      identity: {
        getRedirectURL: () => "https://abcdefghijklmnopqrstuvwxyz123456.chromiumapp.org/",
        launchWebAuthFlow: async () => {
          throw new Error("The user did not approve access.");
        },
      },
      storage: {
        local: {
          remove: async (key: string) => {
            storageRemovedKey = key;
          },
        },
      },
    };

    globalThis.fetch = (async (url: string) => {
      if (url.toString().includes("/auth/github/state")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ state: "valid_state_1234567890" }),
        } as unknown as Response;
      }
      throw new Error("Unexpected fetch");
    }) as typeof fetch;

    await assert.rejects(
      () => loginWithGitHub(),
      /cancelled by the user/
    );

    assert.equal(storageRemovedKey, "github_auth");
  });

  it("handles access_denied from GitHub callback gracefully", async () => {
    (globalThis as unknown as { chrome: unknown }).chrome = {
      identity: {
        getRedirectURL: () => "https://abcdefghijklmnopqrstuvwxyz123456.chromiumapp.org/",
        launchWebAuthFlow: async () => {
          return "https://abcdefghijklmnopqrstuvwxyz123456.chromiumapp.org/?error=access_denied&error_description=The+user+has+denied+your+application+access.";
        },
      },
      storage: {
        local: {
          remove: async (key: string) => {
            storageRemovedKey = key;
          },
        },
      },
    };

    globalThis.fetch = (async (url: string) => {
      if (url.toString().includes("/auth/github/state")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ state: "valid_state_1234567890" }),
        } as unknown as Response;
      }
      throw new Error("Unexpected fetch");
    }) as typeof fetch;

    await assert.rejects(
      () => loginWithGitHub(),
      /Access was denied during GitHub authorization/
    );

    assert.equal(storageRemovedKey, "github_auth");
  });
});
