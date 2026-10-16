import test from "node:test";
import assert from "node:assert/strict";
import { getManifest } from "../manifest.config.ts";

test("Manifest V3 Configuration", async (t) => {
  await t.test("Development mode configuration", () => {
    const manifest = getManifest("development");

    assert.equal(manifest.manifest_version, 3);
    assert.equal(manifest.name, "Solohub (Dev)");
    assert.deepEqual(manifest.permissions, ["storage", "identity"]);
    assert.ok(manifest.host_permissions?.includes("https://api.github.com/*"));
    assert.ok(manifest.host_permissions?.includes("http://localhost:3001/*"));
    assert.ok(manifest.host_permissions?.includes("http://127.0.0.1:3001/*"));
    assert.equal(
      manifest.permissions?.includes("tabs" as unknown as chrome.runtime.ManifestPermissions),
      false
    );
  });

  await t.test("Production mode configuration", () => {
    const manifest = getManifest("production");

    assert.equal(manifest.manifest_version, 3);
    assert.equal(manifest.name, "Solohub");
    assert.deepEqual(manifest.permissions, ["storage", "identity"]);
    assert.ok(manifest.host_permissions?.includes("https://api.github.com/*"));

    // Crucial: Production must NOT contain localhost origins
    assert.equal(
      manifest.host_permissions?.some((p) => p.includes("localhost")),
      false,
      "Production manifest must not include localhost"
    );
    assert.equal(
      manifest.host_permissions?.some((p) => p.includes("127.0.0.1")),
      false,
      "Production manifest must not include 127.0.0.1"
    );

    // Permissions check: 'tabs' must not be present
    assert.equal(
      manifest.permissions?.includes("tabs" as unknown as chrome.runtime.ManifestPermissions),
      false,
      "Permissions must not include 'tabs'"
    );

    // Web accessible resources should be absent
    assert.equal(
      manifest.web_accessible_resources,
      undefined,
      "Production manifest must omit broad web_accessible_resources"
    );
  });

  await t.test("Dynamic backend host permissions in production", () => {
    const manifest = getManifest("production", {
      VITE_BACKEND_URL: "https://auth.solohub.io",
    });

    assert.ok(manifest.host_permissions?.includes("https://auth.solohub.io/*"));
    assert.ok(manifest.host_permissions?.includes("https://api.github.com/*"));
    assert.equal(
      manifest.host_permissions?.some((p) => p.includes("localhost")),
      false
    );
  });

  await t.test("Rejects insecure or invalid backend URLs in production manifest", () => {
    assert.throws(
      () =>
        getManifest("production", {
          VITE_BACKEND_URL: "http://insecure-backend.com",
        }),
      /Insecure backend URL protocol in production build: http:. Production requires HTTPS./
    );

    assert.throws(
      () =>
        getManifest("production", {
          VITE_BACKEND_URL: "not-a-valid-url",
        }),
      /Invalid VITE_BACKEND_URL in production build/
    );
  });
});
