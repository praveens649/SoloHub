import { defineManifest } from "@crxjs/vite-plugin";

/**
 * Builds the Manifest V3 specification for Solohub.
 *
 * Permissions Rationale:
 * - storage: Required for persisting user authentication and preferences in chrome.storage.local.
 * - identity: Required for OAuth 2.0 Web Authentication via chrome.identity.launchWebAuthFlow.
 * - tabs: REMOVED. chrome.tabs.create({ url }) does not require the 'tabs' permission.
 *
 * Host Permissions:
 * - https://api.github.com/*: Mandatory for GitHub REST API queries.
 * - Configured backend URL: Added dynamically based on VITE_BACKEND_URL.
 * - http://localhost:3001/*: Included ONLY during development mode.
 */
export function getManifest(
  mode = "development",
  env: Record<string, string> = {}
) {
  const isProd = mode === "production";
  const backendUrl = env.VITE_BACKEND_URL || process.env.VITE_BACKEND_URL;

  const hostPermissions: string[] = ["https://api.github.com/*"];

  if (backendUrl) {
    let parsed: URL;
    try {
      parsed = new URL(backendUrl);
    } catch {
      if (isProd) {
        throw new Error(
          `Invalid VITE_BACKEND_URL in production build: ${backendUrl}`
        );
      }
      return defineManifest({
        manifest_version: 3,
        name: isProd ? "Solohub" : "Solohub (Dev)",
        version: "0.1.0",
      });
    }

    if (isProd && parsed.protocol !== "https:") {
      throw new Error(
        `Insecure backend URL protocol in production build: ${parsed.protocol}. Production requires HTTPS.`
      );
    }

    if (parsed.origin) {
      hostPermissions.push(`${parsed.origin}/*`);
    }
  }

  // Localhost backend permission is restricted strictly to non-production builds
  if (!isProd) {
    hostPermissions.push("http://localhost:3001/*");
    hostPermissions.push("http://127.0.0.1:3001/*");
  }

  // Deduplicate permissions
  const uniqueHostPermissions = Array.from(new Set(hostPermissions));

  return defineManifest({
    manifest_version: 3,

    name: isProd ? "Solohub" : "Solohub (Dev)",

    version: "0.1.0",

    description: "A productivity GitHub control center for solo developers.",

    icons: {
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png",
    },

    permissions: ["storage", "identity"],

    host_permissions: uniqueHostPermissions,

    action: {
      default_popup: "index.html",
      default_icon: {
        "16": "icons/icon-16.png",
        "32": "icons/icon-32.png",
        "48": "icons/icon-48.png",
        "128": "icons/icon-128.png",
      },
    },

    background: {
      service_worker: "src/background/service-worker.ts",
      type: "module",
    },
  });
}

export default getManifest(process.env.NODE_ENV || "development");