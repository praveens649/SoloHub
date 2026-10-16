import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getBackendUrl, getGitHubClientId } from "../src/lib/github/config.js";

describe("Frontend Configuration (config.ts)", () => {
  it("defaults to http://localhost:3001 in development mode when unset", () => {
    const url = getBackendUrl({
      PROD: false,
      DEV: true,
      MODE: "development",
    });
    assert.equal(url, "http://localhost:3001");
  });

  it("accepts a custom localhost or HTTP URL in development mode", () => {
    const url = getBackendUrl({
      VITE_BACKEND_URL: "http://localhost:8080/",
      PROD: false,
      DEV: true,
      MODE: "development",
    });
    assert.equal(url, "http://localhost:8080");
  });

  it("strictly requires HTTPS in production mode", () => {
    const url = getBackendUrl({
      VITE_BACKEND_URL: "https://auth.solohub.example.com",
      PROD: true,
      MODE: "production",
    });
    assert.equal(url, "https://auth.solohub.example.com");
  });

  it("throws in production mode if VITE_BACKEND_URL is missing", () => {
    assert.throws(
      () =>
        getBackendUrl({
          PROD: true,
          MODE: "production",
        }),
      /Missing configuration: VITE_BACKEND_URL/
    );
  });

  it("throws in production mode if VITE_BACKEND_URL uses HTTP", () => {
    assert.throws(
      () =>
        getBackendUrl({
          VITE_BACKEND_URL: "http://insecure-backend.com",
          PROD: true,
          MODE: "production",
        }),
      /Insecure configuration: VITE_BACKEND_URL must use HTTPS in production/
    );
  });

  it("throws if VITE_BACKEND_URL is not a valid URL", () => {
    assert.throws(
      () =>
        getBackendUrl({
          VITE_BACKEND_URL: "not-a-valid-url",
          PROD: false,
          MODE: "development",
        }),
      /not a valid URL/
    );
  });

  it("returns client ID when properly configured", () => {
    const clientId = getGitHubClientId({
      VITE_GITHUB_CLIENT_ID: "client_12345",
    });
    assert.equal(clientId, "client_12345");
  });

  it("throws if VITE_GITHUB_CLIENT_ID is missing or empty", () => {
    assert.throws(
      () =>
        getGitHubClientId({
          VITE_GITHUB_CLIENT_ID: "   ",
        }),
      /VITE_GITHUB_CLIENT_ID is not configured/
    );
  });
});
