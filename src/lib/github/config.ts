/**
 * Solohub GitHub & Backend Configuration
 * Centralized, validated environment variable access.
 */

function getEnvSource(): Record<string, unknown> {
  if (
    typeof import.meta !== "undefined" &&
    typeof (import.meta as { env?: unknown }).env === "object" &&
    (import.meta as { env?: unknown }).env !== null
  ) {
    return (import.meta as { env: Record<string, unknown> }).env;
  }
  const globalProc = (
    globalThis as unknown as { process?: { env?: Record<string, unknown> } }
  ).process;
  if (globalProc && typeof globalProc.env === "object" && globalProc.env !== null) {
    return globalProc.env;
  }
  return {};
}

export const GITHUB_CLIENT_ID: string =
  (getEnvSource().VITE_GITHUB_CLIENT_ID as string | undefined)?.trim() || "";

/**
 * Returns the validated backend URL for OAuth exchange.
 * In development, defaults to http://localhost:3001.
 * In production, strictly requires a configured HTTPS URL and rejects HTTP.
 */
export function getBackendUrl(
  env: {
    VITE_BACKEND_URL?: unknown;
    PROD?: unknown;
    DEV?: unknown;
    MODE?: unknown;
  } = getEnvSource()
): string {
  const isProd = Boolean(env.PROD || env.MODE === "production");
  const rawUrl =
    typeof env.VITE_BACKEND_URL === "string"
      ? env.VITE_BACKEND_URL.trim()
      : undefined;

  if (rawUrl) {
    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      throw new Error(
        "Invalid configuration: VITE_BACKEND_URL is not a valid URL."
      );
    }

    if (isProd && parsed.protocol !== "https:") {
      throw new Error(
        "Insecure configuration: VITE_BACKEND_URL must use HTTPS in production."
      );
    }

    // Strip trailing slash for consistency
    return rawUrl.replace(/\/+$/, "");
  }

  if (isProd) {
    throw new Error(
      "Missing configuration: VITE_BACKEND_URL must be configured with an HTTPS URL in production."
    );
  }

  // Explicit local development fallback
  return "http://localhost:3001";
}

/**
 * Returns the GitHub OAuth Client ID or throws a user-friendly error if unconfigured.
 */
export function getGitHubClientId(
  env: { VITE_GITHUB_CLIENT_ID?: unknown } = getEnvSource()
): string {
  const rawId = env.VITE_GITHUB_CLIENT_ID;
  const clientId = typeof rawId === "string" ? rawId.trim() : "";
  if (!clientId) {
    throw new Error(
      "Configuration Error: VITE_GITHUB_CLIENT_ID is not configured. Please set it in your environment."
    );
  }
  return clientId;
}