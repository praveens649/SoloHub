import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatGitHubEvents,
  filterActivityItems,
} from "../src/lib/github/activity.ts";
import type { GitHubEvent, GitHubNotification } from "../src/lib/github/client.ts";

describe("GitHub Activity Feed Tests", () => {
  const mockEvents: GitHubEvent[] = [
    {
      id: "ev-1",
      type: "PullRequestEvent",
      created_at: "2026-11-02T10:00:00Z",
      repo: { name: "praveens649/SoloHub" },
      actor: { login: "praveens649", avatar_url: "https://avatars.github.com/u/1" },
      payload: {
        action: "opened",
        pull_request: {
          number: 42,
          title: "Feat: Diwali Seasonal Update",
          html_url: "https://github.com/praveens649/SoloHub/pull/42",
          merged: false,
        },
      },
    },
    {
      id: "ev-2",
      type: "IssuesEvent",
      created_at: "2026-11-02T09:30:00Z",
      repo: { name: "praveens649/SoloHub" },
      actor: { login: "solo-coder", avatar_url: "https://avatars.github.com/u/2" },
      payload: {
        action: "closed",
        issue: {
          number: 15,
          title: "Fix dark mode contrast on settings page",
          html_url: "https://github.com/praveens649/SoloHub/issues/15",
        },
      },
    },
    {
      id: "ev-3",
      type: "PullRequestReviewEvent",
      created_at: "2026-11-02T09:00:00Z",
      repo: { name: "praveens649/SoloHub" },
      actor: { login: "reviewer-1" },
      payload: {
        review: {
          id: 101,
          state: "approved",
          html_url: "https://github.com/praveens649/SoloHub/pull/42#pullrequestreview-101",
        },
        pull_request: {
          number: 42,
          title: "Feat: Diwali Seasonal Update",
          html_url: "https://github.com/praveens649/SoloHub/pull/42",
        },
      },
    },
    {
      id: "ev-4",
      type: "PushEvent",
      created_at: "2026-11-02T08:00:00Z",
      repo: { name: "praveens649/SoloHub" },
      actor: { login: "praveens649" },
      payload: {
        ref: "refs/heads/main",
        commits: [
          { sha: "abc1234", message: "chore: update dependencies" },
          { sha: "def5678", message: "fix: token validation edge case" },
        ],
      },
    },
    {
      id: "ev-5",
      type: "ReleaseEvent",
      created_at: "2026-11-01T20:00:00Z",
      repo: { name: "gathin23/cleanyourtv" },
      actor: { login: "gathin23", avatar_url: "https://avatars.github.com/u/3" },
      payload: {
        action: "published",
        release: {
          tag_name: "v3.3",
          name: "CleanYourTV 3.3: hold OK to move your apps",
          body: "Your Home, in the order you want it. Hold OK on any app...",
          html_url: "https://github.com/gathin23/cleanyourtv/releases/tag/v3.3",
        },
      },
    },
    {
      id: "ev-6",
      type: "CreateEvent",
      created_at: "2026-10-31T15:00:00Z",
      repo: { name: "Sankar-web-dev/business-manthra" },
      actor: { login: "Sankar-web-dev", avatar_url: "https://avatars.github.com/u/4" },
      payload: {
        ref_type: "repository",
        description: "Business dashboard application",
      },
    },
  ];

  it("formats GitHub events into rich, authentic feed items with header phrases and cards", () => {
    const items = formatGitHubEvents(mockEvents, undefined, true);

    assert.equal(items.length, 6);

    // Release item check (matches Gathin23/cleanyourtv released in screenshot)
    const releaseItem = items.find((i) => i.id === "ev-5");
    assert.ok(releaseItem);
    assert.equal(releaseItem.type, "release");
    assert.equal(releaseItem.category, "releases");
    assert.ok(releaseItem.headerText.includes("released"));
    assert.equal(releaseItem.title, "CleanYourTV 3.3: hold OK to move your apps");
    assert.ok(releaseItem.body?.includes("Your Home"));
    assert.equal(releaseItem.actor.login, "gathin23");
    assert.equal(releaseItem.isFollowing, true);

    // Created Repository item check (matches Sankar-web-dev created a repository in screenshot)
    const repoItem = items.find((i) => i.id === "ev-6");
    assert.ok(repoItem);
    assert.equal(repoItem.type, "repo_created");
    assert.equal(repoItem.category, "repos");
    assert.equal(repoItem.headerText, "Sankar-web-dev created a repository");
    assert.equal(repoItem.repoName, "Sankar-web-dev/business-manthra");
    assert.equal(repoItem.description, "Business dashboard application");

    // PR item check
    const prItem = items.find((i) => i.id === "ev-1");
    assert.ok(prItem);
    assert.equal(prItem.type, "pr");
    assert.equal(prItem.category, "prs");
    assert.equal(prItem.title, "Feat: Diwali Seasonal Update");
    assert.equal(prItem.url, "https://github.com/praveens649/SoloHub/pull/42");

    // Issues item check
    const issueItem = items.find((i) => i.id === "ev-2");
    assert.ok(issueItem);
    assert.equal(issueItem.type, "issue");
    assert.equal(issueItem.category, "issues");
    assert.equal(issueItem.url, "https://github.com/praveens649/SoloHub/issues/15");

    // Push item check
    const pushItem = items.find((i) => i.id === "ev-4");
    assert.ok(pushItem);
    assert.equal(pushItem.type, "commit");
    assert.equal(pushItem.category, "commits");
    assert.equal(pushItem.title, "chore: update dependencies");
  });

  it("filters activity items accurately by category", () => {
    const items = formatGitHubEvents(mockEvents);

    const releases = filterActivityItems(items, "releases");
    assert.equal(releases.length, 1);
    assert.equal(releases[0].id, "ev-5");

    const repos = filterActivityItems(items, "repos");
    assert.equal(repos.length, 1);
    assert.equal(repos[0].id, "ev-6");

    const prs = filterActivityItems(items, "prs");
    assert.equal(prs.length, 1);
    assert.equal(prs[0].id, "ev-1");

    const issues = filterActivityItems(items, "issues");
    assert.equal(issues.length, 1);
    assert.equal(issues[0].id, "ev-2");

    const commits = filterActivityItems(items, "commits");
    assert.equal(commits.length, 1);
    assert.equal(commits[0].id, "ev-4");

    const all = filterActivityItems(items, "all");
    assert.equal(all.length, 6);
  });

  it("deduplicates repeated activity events by ID", () => {
    const duplicates = [...mockEvents, mockEvents[0], mockEvents[1]];
    assert.equal(duplicates.length, 8);

    const deduplicated = formatGitHubEvents(duplicates);
    assert.equal(deduplicated.length, 6);
  });

  it("integrates repository notifications smoothly and gracefully", () => {
    const mockNotifications: GitHubNotification[] = [
      {
        id: "notif-99",
        unread: true,
        reason: "mention",
        updated_at: "2026-11-02T11:00:00Z",
        last_read_at: null,
        subject: {
          title: "Mentioned in issue #20",
          url: null,
          latest_comment_url: null,
          type: "Issue",
        },
        repository: {
          id: 555,
          name: "SoloHub",
          full_name: "praveens649/SoloHub",
          html_url: "https://github.com/praveens649/SoloHub",
          owner: { login: "praveens649" },
        },
      },
    ];

    const merged = formatGitHubEvents(mockEvents, mockNotifications);
    assert.equal(merged.length, 7);

    const notifItem = merged.find((i) => i.id === "notif-notif-99");
    assert.ok(notifItem);
    assert.equal(notifItem.category, "issues");
    assert.equal(notifItem.title, "Mentioned in issue #20");
  });

  it("ensures every item has valid, safe navigation links to GitHub", () => {
    const items = formatGitHubEvents(mockEvents);

    for (const item of items) {
      assert.ok(item.url.startsWith("https://github.com/"), `Unsafe link: ${item.url}`);
      assert.ok(item.repoName.length > 0);
      assert.ok(item.actor.login.length > 0);
      assert.ok(item.timeAgo.length > 0);
    }
  });
});
