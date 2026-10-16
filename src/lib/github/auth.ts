import { getBackendUrl, getGitHubClientId } from "./config";
import { getGitHubUser } from "./client";
import { clearAuth } from "../storage/auth";

/**
 * Initiates the GitHub OAuth 2.0 Web Authentication flow with backend-coordinated state.
 *
 * Flow:
 * 1. Resolves Chrome extension redirect URI via chrome.identity.getRedirectURL().
 * 2. Fetches a cryptographically random, single-use, 10-minute state token from the backend.
 * 3. Launches GitHub authorization via chrome.identity.launchWebAuthFlow().
 * 4. Verifies callback URL for errors, cancellation, and exact state match.
 * 5. Exchanges the authorization code + redirect URI + state with the backend.
 * 6. Validates the resulting access token against GitHub's /user profile API.
 * 7. Cleans up partial state on failure and returns the verified access token.
 */
export async function loginWithGitHub(): Promise<string> {
  if (
    typeof chrome === "undefined" ||
    !chrome.identity?.getRedirectURL ||
    !chrome.identity?.launchWebAuthFlow
  ) {
    throw new Error(
      "Chrome Identity API is not available in the current environment."
    );
  }

  // 1. Get Extension Redirect URI
  const redirectUri = chrome.identity.getRedirectURL();

  // 2. Validate configuration
  const backendUrl = getBackendUrl();
  const clientId = getGitHubClientId();

  // 3. Request fresh, unpredictable state token from the backend
  let sessionState: string;
  try {
    const stateResponse = await fetch(`${backendUrl}/auth/github/state`, {
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(10000), // 10-second timeout
    });

    if (!stateResponse.ok) {
      throw new Error(
        `Backend authentication service returned status ${stateResponse.status}`
      );
    }

    const stateData = (await stateResponse.json()) as { state?: unknown };
    if (!stateData?.state || typeof stateData.state !== "string" || stateData.state.length < 16) {
      throw new Error("Backend returned an invalid OAuth state token.");
    }

    sessionState = stateData.state;
  } catch (err) {
    await clearAuth().catch(() => {});
    const msg = err instanceof Error ? err.message : "Network error";
    throw new Error(
      `Failed to initialize authentication session with backend: ${msg}`,
      { cause: err }
    );
  }

  // 4. Construct authorization URL with backend-issued state
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "repo read:user user:email read:org",
    state: sessionState,
  });

  const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;

  // 5. Launch interactive web auth flow
  let responseUrl: string | undefined;
  try {
    responseUrl = await chrome.identity.launchWebAuthFlow({
      url: authUrl,
      interactive: true,
    });
  } catch (flowErr) {
    await clearAuth().catch(() => {});
    const errorMsg =
      flowErr instanceof Error ? flowErr.message : String(flowErr);

    if (
      errorMsg.includes("canceled") ||
      errorMsg.includes("User cancelled") ||
      errorMsg.includes("The user did not approve")
    ) {
      throw new Error("GitHub authorization was cancelled by the user.", {
        cause: flowErr,
      });
    }

    throw new Error(`Authentication flow encountered an error: ${errorMsg}`, {
      cause: flowErr,
    });
  }

  if (!responseUrl) {
    await clearAuth().catch(() => {});
    throw new Error("GitHub authentication was cancelled or returned an empty response.");
  }

  // 6. Parse and validate callback URL
  let callbackUrl: URL;
  try {
    callbackUrl = new URL(responseUrl);
  } catch (parseErr) {
    await clearAuth().catch(() => {});
    throw new Error("Received an unparseable authentication callback URL.", {
      cause: parseErr,
    });
  }

  // Check for callback errors from GitHub (e.g., access_denied)
  const callbackError = callbackUrl.searchParams.get("error");
  const callbackErrorDesc = callbackUrl.searchParams.get("error_description");
  if (callbackError) {
    await clearAuth().catch(() => {});
    if (callbackError === "access_denied") {
      throw new Error("Access was denied during GitHub authorization.");
    }
    throw new Error(
      callbackErrorDesc || `GitHub authentication error: ${callbackError}`
    );
  }

  const returnedState = callbackUrl.searchParams.get("state");
  const code = callbackUrl.searchParams.get("code");

  // 7. Verify OAuth State against the state issued for this attempt
  if (!returnedState || returnedState !== sessionState) {
    await clearAuth().catch(() => {});
    throw new Error(
      "Security verification failed: OAuth state mismatch or missing. Login rejected."
    );
  }

  // 8. Validate Authorization Code presence
  if (!code || typeof code !== "string" || code.trim().length === 0) {
    await clearAuth().catch(() => {});
    throw new Error("GitHub authorization code missing in callback.");
  }

  // 9. Exchange code through the hardened backend
  let accessToken: string;
  try {
    const tokenResponse = await fetch(`${backendUrl}/auth/github/exchange`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        code: code.trim(),
        redirect_uri: redirectUri,
        state: sessionState,
      }),
      signal: AbortSignal.timeout(15000), // 15-second timeout for exchange
    });

    const data = (await tokenResponse.json().catch(() => null)) as {
      access_token?: unknown;
      error?: unknown;
    } | null;

    if (!tokenResponse.ok) {
      const errorMsg =
        data && typeof data.error === "string"
          ? data.error
          : `Failed to exchange authorization code (HTTP ${tokenResponse.status})`;
      throw new Error(errorMsg);
    }

    if (!data?.access_token || typeof data.access_token !== "string") {
      throw new Error("Backend response did not contain a valid access token.");
    }

    accessToken = data.access_token;
  } catch (exchangeErr) {
    await clearAuth().catch(() => {});
    const msg =
      exchangeErr instanceof Error ? exchangeErr.message : "Exchange failed";
    throw new Error(`Token exchange failed: ${msg}`, { cause: exchangeErr });
  }

  // 10. Fetch and validate GitHub user profile to ensure token is active and usable
  try {
    const user = await getGitHubUser(accessToken);
    if (!user || !user.login) {
      throw new Error("User profile validation failed: empty response.");
    }
  } catch (userErr) {
    await clearAuth().catch(() => {});
    const msg =
      userErr instanceof Error ? userErr.message : "Profile check failed";
    throw new Error(
      `Received token could not be verified with GitHub API: ${msg}`,
      { cause: userErr }
    );
  }

  // Return verified access token (caller persists only upon full success)
  return accessToken;
}