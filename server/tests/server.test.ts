import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { validateConfig, type ServerConfig } from "../src/config.js";
import { OAuthStateStore } from "../src/stateStore.js";
import { createApp } from "../src/app.js";

const mockConfig: ServerConfig = {
  GITHUB_CLIENT_ID: "mock_client_id_123",
  GITHUB_CLIENT_SECRET: "mock_client_secret_xyz",
  PORT: 3001,
  NODE_ENV: "test",
  ALLOWED_ORIGINS: [],
  ALLOWED_REDIRECT_URIS: [],
  REQUIRE_OAUTH_STATE: false,
};

describe("Server Configuration & Startup Validation", () => {
  it("fails startup validation when GITHUB_CLIENT_ID is missing", () => {
    assert.throws(
      () =>
        validateConfig({
          GITHUB_CLIENT_SECRET: "some_secret",
        }),
      /GITHUB_CLIENT_ID is required/
    );
  });

  it("fails startup validation when GITHUB_CLIENT_SECRET is missing", () => {
    assert.throws(
      () =>
        validateConfig({
          GITHUB_CLIENT_ID: "some_id",
        }),
      /GITHUB_CLIENT_SECRET is required/
    );
  });

  it("fails startup validation when PORT is out of range", () => {
    assert.throws(
      () =>
        validateConfig({
          GITHUB_CLIENT_ID: "some_id",
          GITHUB_CLIENT_SECRET: "some_secret",
          PORT: "99999",
        }),
      /Invalid PORT/
    );
  });

  it("successfully parses valid configuration", () => {
    const config = validateConfig({
      GITHUB_CLIENT_ID: "test_client_id",
      GITHUB_CLIENT_SECRET: "test_client_secret",
      PORT: "4000",
      ALLOWED_ORIGINS: "http://localhost:5173,chrome-extension://abcdef",
      REQUIRE_OAUTH_STATE: "true",
    });

    assert.equal(config.GITHUB_CLIENT_ID, "test_client_id");
    assert.equal(config.PORT, 4000);
    assert.deepEqual(config.ALLOWED_ORIGINS, [
      "http://localhost:5173",
      "chrome-extension://abcdef",
    ]);
    assert.equal(config.REQUIRE_OAUTH_STATE, true);
  });
});

describe("OAuthStateStore", () => {
  let stateStore: OAuthStateStore;

  beforeEach(() => {
    stateStore = new OAuthStateStore(1000); // 1s TTL for test
  });

  it("generates random state and successfully single-use consumes it", () => {
    const state = stateStore.generateState();
    assert.ok(state.length > 20);

    const firstCheck = stateStore.consumeState(state);
    assert.equal(firstCheck.valid, true);

    // Replay attack prevention: second consume fails
    const secondCheck = stateStore.consumeState(state);
    assert.equal(secondCheck.valid, false);
  });

  it("rejects unknown or invalid state tokens", () => {
    const check = stateStore.consumeState("completely_invalid_state");
    assert.equal(check.valid, false);
  });

  it("rejects expired state tokens", async () => {
    const state = stateStore.generateState(10); // 10ms TTL
    await new Promise((resolve) => setTimeout(resolve, 30));

    const check = stateStore.consumeState(state);
    assert.equal(check.valid, false);
    assert.match(check.reason || "", /expired/i);
  });
});

describe("Hardened Express App", () => {
  let stateStore: OAuthStateStore;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    stateStore = new OAuthStateStore();
    app = createApp(mockConfig, stateStore);
  });

  it("preserves GET /health endpoint", async () => {
    const res = await request(app).get("/health");
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { status: "ok" });
  });

  it("applies security headers via helmet", async () => {
    const res = await request(app).get("/health");
    assert.equal(res.headers["x-content-type-options"], "nosniff");
    assert.equal(res.headers["x-frame-options"], "SAMEORIGIN");
    assert.equal(res.headers["x-powered-by"], undefined);
  });

  it("generates state token on GET /auth/github/state", async () => {
    const res = await request(app).get("/auth/github/state");
    assert.equal(res.status, 200);
    assert.ok(typeof res.body.state === "string");
    assert.ok(res.body.state.length > 20);
  });

  it("rejects POST /auth/github/exchange with missing body or code", async () => {
    const res = await request(app)
      .post("/auth/github/exchange")
      .send({});

    assert.equal(res.status, 400);
    assert.match(res.body.error, /Authorization code is required/);
  });

  it("rejects POST /auth/github/exchange with malformed code", async () => {
    const res = await request(app)
      .post("/auth/github/exchange")
      .send({
        code: "invalid code with spaces and <<scripts>>",
        redirect_uri: "https://abcdefabcdefabcdefabcdefabcdefab.chromiumapp.org/",
      });

    assert.equal(res.status, 400);
    assert.match(res.body.error, /Invalid authorization code format/);
  });

  it("rejects POST /auth/github/exchange with missing redirect_uri", async () => {
    const res = await request(app)
      .post("/auth/github/exchange")
      .send({
        code: "valid_code_1234567890",
      });

    assert.equal(res.status, 400);
    assert.match(res.body.error, /redirect_uri is required/);
  });

  it("rejects POST /auth/github/exchange with non-HTTPS redirect_uri", async () => {
    const res = await request(app)
      .post("/auth/github/exchange")
      .send({
        code: "valid_code_1234567890",
        redirect_uri: "http://malicious.site/callback",
      });

    assert.equal(res.status, 400);
    assert.match(res.body.error, /HTTPS protocol/);
  });

  it("rejects POST /auth/github/exchange with unauthorized redirect_uri domain", async () => {
    const res = await request(app)
      .post("/auth/github/exchange")
      .send({
        code: "valid_code_1234567890",
        redirect_uri: "https://evil-phishing-site.com/callback",
      });

    assert.equal(res.status, 400);
    assert.match(res.body.error, /untrusted or unauthorized redirect destination/);
  });

  it("rejects request if state is required but invalid", async () => {
    const strictStateConfig: ServerConfig = {
      ...mockConfig,
      REQUIRE_OAUTH_STATE: true,
    };
    const strictApp = createApp(strictStateConfig, stateStore);

    const res = await request(strictApp)
      .post("/auth/github/exchange")
      .send({
        code: "valid_code_1234567890",
        redirect_uri: "https://abcdefabcdefabcdefabcdefabcdefab.chromiumapp.org/",
        state: "fake_nonexistent_state",
      });

    assert.equal(res.status, 400);
    assert.match(res.body.error, /state/i);
  });

  it("safely handles upstream GitHub error responses without leaking sensitive data", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      return {
        ok: false,
        status: 400,
        json: async () => ({
          error: "bad_verification_code",
          error_description: "The code passed is incorrect or has expired.",
        }),
      } as unknown as Response;
    }) as typeof fetch;

    try {
      const res = await request(app)
        .post("/auth/github/exchange")
        .send({
          code: "test_code_1234567890",
          redirect_uri: "https://abcdefabcdefabcdefabcdefabcdefab.chromiumapp.org/",
        });

      assert.equal(res.status, 400);
      assert.equal(
        res.body.error,
        "The authorization code is invalid or has expired."
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("returns access_token on successful upstream exchange", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          access_token: "gho_mock_access_token_for_tests",
          token_type: "bearer",
          scope: "repo,read:user",
        }),
      } as unknown as Response;
    }) as typeof fetch;

    try {
      const res = await request(app)
        .post("/auth/github/exchange")
        .send({
          code: "test_code_1234567890",
          redirect_uri: "https://abcdefabcdefabcdefabcdefabcdefab.chromiumapp.org/",
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.access_token, "gho_mock_access_token_for_tests");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("handles upstream timeouts with 504 Gateway Timeout", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      const err = new Error("The operation was aborted due to timeout");
      err.name = "TimeoutError";
      throw err;
    }) as typeof fetch;

    try {
      const res = await request(app)
        .post("/auth/github/exchange")
        .send({
          code: "test_code_1234567890",
          redirect_uri: "https://abcdefabcdefabcdefabcdefabcdefab.chromiumapp.org/",
        });

      assert.equal(res.status, 504);
      assert.match(res.body.error, /timed out/i);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
