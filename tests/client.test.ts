import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateGitHubEndpoint,
  githubFetch,
  GitHubApiError,
  GitHubNetworkError,
} from "../src/lib/github/client.js";

describe("GitHub API Client Hardening (client.ts)", () => {
  it("accepts valid relative API endpoints", () => {
    const url1 = validateGitHubEndpoint("/user");
    assert.equal(url1.toString(), "https://api.github.com/user");

    const url2 = validateGitHubEndpoint("/repos/octocat/hello-world/pulls?state=open");
    assert.equal(
      url2.toString(),
      "https://api.github.com/repos/octocat/hello-world/pulls?state=open"
    );
  });

  it("rejects absolute URLs (prevents SSRF/arbitrary destination attacks)", () => {
    assert.throws(
      () => validateGitHubEndpoint("https://evil.attacker.com/steal"),
      /absolute and protocol-relative URLs are prohibited/
    );

    assert.throws(
      () => validateGitHubEndpoint("http://api.github.com/user"),
      /absolute and protocol-relative URLs are prohibited/
    );
  });

  it("rejects protocol-relative URLs", () => {
    assert.throws(
      () => validateGitHubEndpoint("//api.github.com/user"),
      /absolute and protocol-relative URLs are prohibited/
    );
  });

  it("rejects endpoints without leading slash", () => {
    assert.throws(
      () => validateGitHubEndpoint("user/repos"),
      /endpoint must start with a leading slash/
    );
  });

  it("rejects path traversal sequences", () => {
    assert.throws(
      () => validateGitHubEndpoint("/repos/owner/../../evil"),
      /path traversal sequences are prohibited/
    );

    assert.throws(
      () => validateGitHubEndpoint("/repos\\evil"),
      /path traversal sequences are prohibited/
    );
  });

  it("prevents caller-supplied headers from overriding Authorization or Accept", async () => {
    const originalFetch = globalThis.fetch;
    let capturedHeaders: Headers | undefined;

    globalThis.fetch = (async (_url: string, init?: RequestInit) => {
      capturedHeaders = new Headers(init?.headers);
      return {
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ login: "testuser" }),
      } as unknown as Response;
    }) as typeof fetch;

    try {
      await githubFetch<{ login: string }>("/user", "legitimate_token_123", {
        headers: {
          authorization: "Bearer malicious_override_token",
          Authorization: "Bearer uppercase_override",
          Accept: "text/plain",
          "X-GitHub-Api-Version": "1999-01-01",
        },
      });

      assert.ok(capturedHeaders);
      // Verify Authorization was enforced
      assert.equal(
        capturedHeaders.get("authorization"),
        "Bearer legitimate_token_123"
      );
      // Verify Accept header was enforced
      assert.equal(
        capturedHeaders.get("accept"),
        "application/vnd.github+json"
      );
      // Verify API version was enforced
      assert.equal(
        capturedHeaders.get("x-github-api-version"),
        "2022-11-28"
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("maps TypeError to GitHubNetworkError", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      throw new TypeError("Failed to fetch");
    }) as typeof fetch;

    try {
      await assert.rejects(
        () => githubFetch("/user", "token"),
        GitHubNetworkError
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("parses rate limit headers on error and throws GitHubApiError", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      return {
        ok: false,
        status: 403,
        statusText: "Forbidden",
        headers: new Headers({
          "x-ratelimit-limit": "60",
          "x-ratelimit-remaining": "0",
          "x-ratelimit-reset": "1700000000",
        }),
        json: async () => ({ message: "API rate limit exceeded" }),
      } as unknown as Response;
    }) as typeof fetch;

    try {
      await assert.rejects(
        () => githubFetch("/user", "token"),
        (err: unknown) => {
          assert.ok(err instanceof GitHubApiError);
          assert.equal(err.status, 403);
          assert.equal(err.rateLimitRemaining, 0);
          assert.equal(err.message, "API rate limit exceeded");
          return true;
        }
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
