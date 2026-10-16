import dotenv from "dotenv";

dotenv.config();

export interface ServerConfig {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  PORT: number;
  NODE_ENV: string;
  ALLOWED_ORIGINS: string[];
  ALLOWED_REDIRECT_URIS: string[];
  REQUIRE_OAUTH_STATE: boolean;
}

export function validateConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const GITHUB_CLIENT_ID = env.GITHUB_CLIENT_ID?.trim();
  const GITHUB_CLIENT_SECRET = env.GITHUB_CLIENT_SECRET?.trim();

  if (!GITHUB_CLIENT_ID) {
    throw new Error(
      "Configuration Error: GITHUB_CLIENT_ID is required and cannot be empty."
    );
  }

  if (!GITHUB_CLIENT_SECRET) {
    throw new Error(
      "Configuration Error: GITHUB_CLIENT_SECRET is required and cannot be empty."
    );
  }

  const rawPort = env.PORT || "3001";
  const PORT = parseInt(rawPort, 10);
  if (isNaN(PORT) || PORT < 1 || PORT > 65535) {
    throw new Error(
      `Configuration Error: Invalid PORT "${rawPort}". Must be between 1 and 65535.`
    );
  }

  const NODE_ENV = env.NODE_ENV?.trim() || "development";

  const ALLOWED_ORIGINS = env.ALLOWED_ORIGINS
    ? env.ALLOWED_ORIGINS.split(",")
        .map((o) => o.trim())
        .filter(Boolean)
    : [];

  const ALLOWED_REDIRECT_URIS = env.ALLOWED_REDIRECT_URIS
    ? env.ALLOWED_REDIRECT_URIS.split(",")
        .map((u) => u.trim())
        .filter(Boolean)
    : [];

  const REQUIRE_OAUTH_STATE = env.REQUIRE_OAUTH_STATE?.toLowerCase() === "true";

  return {
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    PORT,
    NODE_ENV,
    ALLOWED_ORIGINS,
    ALLOWED_REDIRECT_URIS,
    REQUIRE_OAUTH_STATE,
  };
}
