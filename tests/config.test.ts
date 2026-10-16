import test from "node:test";
import assert from "node:assert/strict";
import { getBackendUrl, getGitHubClientId } from "../src/lib/github/config.ts";

test("Frontend Configuration Security", async (t) => {
  await t.test("getBackendUrl in development", () => {
    // Defaults to localhost in development
    const url = getBackendUrl({ DEV: true, MODE: "development" });
    assert.equal(url, "http://localhost:3001");

    // Allows custom HTTP in development
    const custom = getBackendUrl({
      DEV: true,
      MODE: "development",
      VITE_BACKEND_URL: "http://localhost:4000",
    });
    assert.equal(custom, "http://localhost:4000");
  });

  await t.test("getBackendUrl in production", () => {
    // Fails safely if unconfigured in production
    assert.throws(
      () => getBackendUrl({ PROD: true, MODE: "production" }),
      /Missing configuration: VITE_BACKEND_URL must be configured/
    );

    // Rejects insecure HTTP in production
    assert.throws(
      () =>
        getBackendUrl({
          PROD: true,
          MODE: "production",
          VITE_BACKEND_URL: "http://insecure.example.com",
        }),
      /Insecure configuration: VITE_BACKEND_URL must use HTTPS in production/
    );

    // Accepts valid HTTPS in production and strips trailing slash
    const valid = getBackendUrl({
      PROD: true,
      MODE: "production",
      VITE_BACKEND_URL: "https://auth.solohub.io/api/",
    });
    assert.equal(valid, "https://auth.solohub.io/api");
  });

  await t.test("getGitHubClientId validation", () => {
    // Rejects empty or missing client ID
    assert.throws(
      () => getGitHubClientId({}),
      /VITE_GITHUB_CLIENT_ID is not configured/
    );
    assert.throws(
      () => getGitHubClientId({ VITE_GITHUB_CLIENT_ID: "   " }),
      /VITE_GITHUB_CLIENT_ID is not configured/
    );

    // Returns trimmed client ID
    const clientId = getGitHubClientId({
      VITE_GITHUB_CLIENT_ID: "  client-12345  ",
    });
    assert.equal(clientId, "client-12345");
  });
});
