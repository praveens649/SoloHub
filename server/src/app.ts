import express, { type Request, type Response, type NextFunction } from "express";
import cors, { type CorsOptions } from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import type { ServerConfig } from "./config.js";
import { OAuthStateStore, defaultStateStore } from "./stateStore.js";

// Standard GitHub OAuth code pattern: alphanumeric with hyphens/underscores
const AUTH_CODE_REGEX = /^[a-zA-Z0-9_-]{10,256}$/;

// Standard Chrome Extension chromiumapp.org URL
const CHROMIUMAPP_REGEX = /^https:\/\/[a-z0-9]{32}\.chromiumapp\.org(?:\/.*)?$/i;
const DEV_CHROMIUMAPP_REGEX = /^https:\/\/[a-z0-9_-]+\.chromiumapp\.org(?:\/.*)?$/i;

export function createApp(
  config: ServerConfig,
  stateStore: OAuthStateStore = defaultStateStore
) {
  const app = express();

  // 1. Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  // 2. Strict CORS Configuration
  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. extension background workers, curl, internal calls)
      if (!origin) {
        return callback(null, true);
      }

      // Check explicit allowlist if provided
      if (config.ALLOWED_ORIGINS.length > 0) {
        if (config.ALLOWED_ORIGINS.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error("CORS origin not allowed"), false);
      }

      // In development mode, allow localhost and chrome-extension origins
      if (config.NODE_ENV !== "production") {
        if (
          origin.startsWith("chrome-extension://") ||
          origin === "http://localhost:5173" ||
          origin === "http://localhost:3000" ||
          origin === "http://127.0.0.1:5173"
        ) {
          return callback(null, true);
        }
      }

      // Reject all unauthorized web origins
      return callback(new Error("CORS origin not allowed"), false);
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept"],
    credentials: false, // Do not rely on ambient cookies/credentials
  };

  app.use(cors(corsOptions));

  // 3. Request Body Size Limit
  app.use(express.json({ limit: "10kb" }));

  // 4. Rate Limiting on OAuth Exchange Endpoints (abuse protection)
  const exchangeRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // max 30 attempts per 15 minutes per IP
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
      error: "Too many authentication attempts. Please try again later.",
    },
  });

  // 5. Health Check Endpoint (Preserved)
  app.get("/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
    });
  });

  // 6. OAuth State Initiation Endpoint (for coordinated expiration & single-use)
  app.get("/auth/github/state", (_req: Request, res: Response) => {
    const state = stateStore.generateState();
    res.json({ state });
  });

  // 7. OAuth Token Exchange Endpoint
  app.post(
    "/auth/github/exchange",
    exchangeRateLimiter,
    async (req: Request, res: Response) => {
      try {
        const body = req.body;

        if (!body || typeof body !== "object") {
          return res.status(400).json({
            error: "Invalid request payload: expected JSON object.",
          });
        }

        const { code, redirect_uri, state } = body;

        // Validate code
        if (!code || typeof code !== "string") {
          return res.status(400).json({
            error: "Authorization code is required and must be a string.",
          });
        }

        const trimmedCode = code.trim();
        if (!AUTH_CODE_REGEX.test(trimmedCode)) {
          return res.status(400).json({
            error: "Invalid authorization code format.",
          });
        }

        // Validate redirect_uri
        if (!redirect_uri || typeof redirect_uri !== "string") {
          return res.status(400).json({
            error: "redirect_uri is required and must be a string.",
          });
        }

        const trimmedRedirectUri = redirect_uri.trim();
        let parsedRedirectUrl: URL;
        try {
          parsedRedirectUrl = new URL(trimmedRedirectUri);
        } catch {
          return res.status(400).json({
            error: "Invalid redirect_uri: must be a valid URL.",
          });
        }

        if (parsedRedirectUrl.protocol !== "https:") {
          return res.status(400).json({
            error: "Invalid redirect_uri: must use HTTPS protocol.",
          });
        }

        // Validate redirect URI against allowlist or standard Chrome extension patterns
        let redirectUriAllowed = false;
        if (config.ALLOWED_REDIRECT_URIS.length > 0) {
          redirectUriAllowed = config.ALLOWED_REDIRECT_URIS.some((allowed) => {
            if (allowed.endsWith("*")) {
              return trimmedRedirectUri.startsWith(allowed.slice(0, -1));
            }
            return trimmedRedirectUri === allowed;
          });
        } else {
          // Default: allow chromiumapp.org callback URLs
          const regexToUse =
            config.NODE_ENV === "production"
              ? CHROMIUMAPP_REGEX
              : DEV_CHROMIUMAPP_REGEX;
          redirectUriAllowed = regexToUse.test(trimmedRedirectUri);
        }

        if (!redirectUriAllowed) {
          return res.status(400).json({
            error: "Invalid redirect_uri: untrusted or unauthorized redirect destination.",
          });
        }

        // Validate state parameter if required or provided
        if (config.REQUIRE_OAUTH_STATE) {
          if (!state || typeof state !== "string") {
            return res.status(400).json({
              error: "OAuth state parameter is required.",
            });
          }
          const stateCheck = stateStore.consumeState(state.trim());
          if (!stateCheck.valid) {
            return res.status(400).json({
              error: stateCheck.reason || "Invalid OAuth state.",
            });
          }
        } else if (state && typeof state === "string") {
          // Optional validation if client passes a state token
          const stateCheck = stateStore.consumeState(state.trim());
          if (!stateCheck.valid) {
            return res.status(400).json({
              error: stateCheck.reason || "Invalid OAuth state.",
            });
          }
        }

        // Perform upstream GitHub exchange with timeout
        const upstreamResponse = await fetch(
          "https://github.com/login/oauth/access_token",
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              "User-Agent": "Solohub-Auth-Server",
            },
            body: JSON.stringify({
              client_id: config.GITHUB_CLIENT_ID,
              client_secret: config.GITHUB_CLIENT_SECRET,
              code: trimmedCode,
              redirect_uri: trimmedRedirectUri,
            }),
            signal: AbortSignal.timeout(10000), // 10-second timeout
          }
        );

        let data: Record<string, unknown> = {};
        try {
          data = (await upstreamResponse.json()) as Record<string, unknown>;
        } catch {
          return res.status(502).json({
            error: "Failed to parse upstream authentication response.",
          });
        }

        if (!upstreamResponse.ok || data.error) {
          // Safe sanitized logging (do NOT log tokens, codes, or secrets)
          const errorCode = String(data.error || "unknown_error");
          console.error(
            `[Auth] GitHub exchange rejected: status=${upstreamResponse.status}, error_code=${errorCode}`
          );

          // Map known GitHub OAuth error codes to safe descriptions
          let userMessage = "Authentication failed with GitHub.";
          if (errorCode === "bad_verification_code") {
            userMessage = "The authorization code is invalid or has expired.";
          } else if (errorCode === "redirect_uri_mismatch") {
            userMessage = "The redirect URI does not match the GitHub OAuth configuration.";
          } else if (typeof data.error_description === "string") {
            userMessage = data.error_description;
          }

          return res.status(400).json({
            error: userMessage,
          });
        }

        if (
          !data.access_token ||
          typeof data.access_token !== "string"
        ) {
          return res.status(502).json({
            error: "GitHub response did not contain a valid access token.",
          });
        }

        return res.json({
          access_token: data.access_token,
        });
      } catch (error: unknown) {
        if (
          error instanceof Error &&
          (error.name === "TimeoutError" || error.name === "AbortError")
        ) {
          console.error("[Auth] GitHub token exchange timed out after 10 seconds.");
          return res.status(504).json({
            error: "Upstream authentication service timed out.",
          });
        }

        console.error(
          "[Auth] Unexpected error during token exchange:",
          error instanceof Error ? error.name : "UnknownError"
        );

        return res.status(500).json({
          error: "Internal server error.",
        });
      }
    }
  );

  // 8. 404 Handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      error: "Endpoint not found.",
    });
  });

  // 9. Centralized Error Handler (Prevents stack trace leakage)
  app.use(
    (
      err: unknown,
      _req: Request,
      res: Response,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _next: NextFunction
    ) => {
      if (err instanceof Error && "type" in err && (err as { type: string }).type === "entity.too.large") {
        return res.status(413).json({
          error: "Request payload too large.",
        });
      }

      if (err instanceof Error && err.message === "CORS origin not allowed") {
        return res.status(403).json({
          error: "Origin not allowed by CORS policy.",
        });
      }

      console.error(
        "[Server] Unhandled request error:",
        err instanceof Error ? err.name : "Unknown"
      );

      return res.status(500).json({
        error: "Internal server error.",
      });
    }
  );

  return app;
}
