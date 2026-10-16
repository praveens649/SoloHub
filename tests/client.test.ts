import test from "node:test";
import assert from "node:assert/strict";
import { validateGitHubEndpoint } from "../src/lib/github/client.ts";

test("GitHub API Client Endpoint Validation", async (t) => {
  await t.test("Valid relative endpoints resolve to GitHub API origin", () => {
    const userUrl = validateGitHubEndpoint("/user");
    assert.equal(userUrl.toString(), "https://api.github.com/user");

    const issuesUrl = validateGitHubEndpoint("/repos/owner/repo/issues?state=open");
    assert.equal(
      issuesUrl.toString(),
      "https://api.github.com/repos/owner/repo/issues?state=open"
    );
  });

  await t.test("Rejects empty or non-string endpoints", () => {
    assert.throws(
      () => validateGitHubEndpoint(""),
      /endpoint must be a non-empty string/
    );
    assert.throws(
      () => validateGitHubEndpoint(null as unknown as string),
      /endpoint must be a non-empty string/
    );
  });

  await t.test("Rejects absolute and protocol-relative URLs", () => {
    assert.throws(
      () => validateGitHubEndpoint("https://evil.com/api"),
      /absolute and protocol-relative URLs are prohibited/
    );
    assert.throws(
      () => validateGitHubEndpoint("http://api.github.com/user"),
      /absolute and protocol-relative URLs are prohibited/
    );
    assert.throws(
      () => validateGitHubEndpoint("//evil.com/user"),
      /absolute and protocol-relative URLs are prohibited/
    );
    assert.throws(
      () => validateGitHubEndpoint("ftp://api.github.com"),
      /absolute and protocol-relative URLs are prohibited/
    );
  });

  await t.test("Rejects endpoints without leading slash", () => {
    assert.throws(
      () => validateGitHubEndpoint("user"),
      /endpoint must start with a leading slash/
    );
  });

  await t.test("Rejects path traversal and backslashes", () => {
    assert.throws(
      () => validateGitHubEndpoint("/repos/../user"),
      /path traversal sequences are prohibited/
    );
    assert.throws(
      () => validateGitHubEndpoint("/user/.."),
      /path traversal sequences are prohibited/
    );
    assert.throws(
      () => validateGitHubEndpoint("/repos\\evil"),
      /path traversal sequences are prohibited/
    );
  });
});
