import { GITHUB_CLIENT_ID } from "./config";

const API_URL = "http://localhost:3001";

export async function loginWithGitHub() {
  const redirectUri = chrome.identity.getRedirectURL();

  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: "repo read:user user:email",
    state,
  });

  const authUrl =
    `https://github.com/login/oauth/authorize?${params.toString()}`;

  const responseUrl = await chrome.identity.launchWebAuthFlow({
    url: authUrl,
    interactive: true,
  });

  if (!responseUrl) {
    throw new Error("GitHub authentication failed");
  }

  const callbackUrl = new URL(responseUrl);

  const returnedState = callbackUrl.searchParams.get("state");
  const code = callbackUrl.searchParams.get("code");

  if (returnedState !== state) {
    throw new Error("Invalid OAuth state");
  }

  if (!code) {
    throw new Error("GitHub authorization failed");
  }

  // Exchange code through our backend
  const tokenResponse = await fetch(
    `${API_URL}/auth/github/exchange`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
        redirect_uri: redirectUri,
      }),
    }
  );

  if (!tokenResponse.ok) {
    throw new Error("Failed to exchange GitHub authorization code");
  }

  const data = await tokenResponse.json();

  if (!data.access_token) {
    throw new Error("GitHub access token missing");
  }

  return data.access_token;
}