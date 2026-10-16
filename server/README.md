# Solohub Authentication Server

The Solohub Authentication Server is a lightweight, hardened Node.js/Express service that performs GitHub OAuth 2.0 authorization code exchange on behalf of the Solohub Chrome Extension.

Because client-side Chrome Extensions cannot securely hide private client secrets, GitHub OAuth Web Application flows require a backend proxy to hold the `GITHUB_CLIENT_SECRET` and complete the token exchange with GitHub.

> **Note**: This backend is **optional** if extension users authenticate via GitHub Personal Access Tokens (PAT). PAT authentication communicates directly with `https://api.github.com` and requires no backend infrastructure.

---

## Architecture Overview

```
┌─────────────────────────────────┐
│     Solohub Chrome Extension    │
│  (Manifest V3 / chrome.identity)│
└──────────────┬──────────────────┘
               │ 1. GET /auth/github/state (Obtain cryptographically secure state)
               ▼
┌─────────────────────────────────┐
│   Solohub Authentication Server │ ◄── Stores state token (10-min TTL, single-use)
└──────────────┬──────────────────┘
               │ 2. launchWebAuthFlow(https://github.com/login/oauth/authorize)
               ▼
┌─────────────────────────────────┐
│           GitHub OAuth          │ ◄── User approves permissions
└──────────────┬──────────────────┘
               │ 3. Redirects to https://<ext-id>.chromiumapp.org/?code=...&state=...
               ▼
┌─────────────────────────────────┐
│     Solohub Chrome Extension    │
└──────────────┬──────────────────┘
               │ 4. POST /auth/github/exchange { code, redirect_uri, state }
               ▼
┌─────────────────────────────────┐
│   Solohub Authentication Server │ ◄── Validates state & redirect_uri; attaches GITHUB_CLIENT_SECRET
└──────────────┬──────────────────┘
               │ 5. POST https://github.com/login/oauth/access_token
               ▼
┌─────────────────────────────────┐
│           GitHub OAuth          │
└──────────────┬──────────────────┘
               │ 6. Returns access_token to Server -> Server returns access_token to Extension
```

---

## Environment Variables

The server validates all configuration variables at startup using an explicit validator (`server/src/config.ts`). Missing or malformed required variables will safely abort server startup with descriptive error messages.

| Variable | Required | Default | Type | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GITHUB_CLIENT_ID` | **Yes** | — | String (Secret/Public ID) | The Client ID of your registered GitHub OAuth App. |
| `GITHUB_CLIENT_SECRET` | **Yes** | — | String (**Secret**) | The Client Secret of your GitHub OAuth App. Never expose or commit this value. |
| `PORT` | No | `3001` | Integer (1–65535) | Port the HTTP service listens on. |
| `NODE_ENV` | No | `development` | String | `development` or `production`. |
| `ALLOWED_ORIGINS` | No | `[]` (allow all) | Comma-separated strings | Explicit CORS origin whitelist (e.g. `chrome-extension://abcdefghijklmnop`). In development, empty allows requests from extension origins. |
| `ALLOWED_REDIRECT_URIS` | No | Default regex | Comma-separated strings | Specific allowed redirect URIs. By default, matches `^https:\/\/[a-z0-9]+\.chromiumapp\.org\/$`. |
| `REQUIRE_OAUTH_STATE` | No | `false` | Boolean (`true`/`false`) | Enforces verification of state tokens issued by `/auth/github/state`. **Set to `true` in production.** |

Copy `.env.example` to `.env` to configure your environment:

```bash
cp .env.example .env
```

---

## Security Controls

1. **Secret Isolation**: `GITHUB_CLIENT_SECRET` is read exclusively on the backend server and is never returned to callers, printed in log statements, or sent to the browser.
2. **Security Headers**: Standard security headers (Content-Security-Policy, HSTS, X-Frame-Options, etc.) are applied via [Helmet](https://helmetjs.github.io/).
3. **Strict Rate Limiting**:
   - General API limiter: 100 requests per 15 minutes per IP.
   - Token exchange limiter (`/auth/github/exchange`): 10 requests per 15 minutes per IP.
4. **Payload Protection**: JSON body parser is restricted to `10kb` to prevent memory exhaustion attacks.
5. **State Verification**: State tokens generated via `crypto.randomBytes(32)` expire after 10 minutes and are deleted upon first use (single-use semantics).
6. **Redirect URI Validation**: Rejects non-HTTPS URIs and ensures the callback matches Chrome's identity provider domain format (`*.chromiumapp.org`) or explicit allowlisted entries.
7. **Upstream Request Timeouts**: External calls to GitHub's token exchange endpoint enforce an explicit 10-second timeout to prevent request hanging and resource starvation.
8. **Sanitized Error Handling**: Upstream error responses from GitHub are parsed and returned with generic error codes without echoing raw headers or sensitive debug payloads.

---

## API Endpoints

### 1. Health Check
- **Method:** `GET`
- **Path:** `/health`
- **Response:**
  ```json
  {
    "status": "ok",
    "timestamp": "2026-10-16T15:00:00.000Z"
  }
  ```

### 2. Generate State Token
- **Method:** `GET`
- **Path:** `/auth/github/state`
- **Rate Limit:** 100 requests per 15 minutes
- **Response:**
  ```json
  {
    "state": "a3f5b8c... (64 hex characters)"
  }
  ```

### 3. Exchange Code for Access Token
- **Method:** `POST`
- **Path:** `/auth/github/exchange`
- **Rate Limit:** 10 requests per 15 minutes
- **Request Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "code": "github_temporary_authorization_code",
    "redirect_uri": "https://<extension-id>.chromiumapp.org/",
    "state": "state_token_previously_issued_by_server"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "access_token": "gho_...",
    "token_type": "bearer",
    "scope": "repo,read:user,notifications"
  }
  ```
- **Error Response (400 Bad Request):**
  ```json
  {
    "error": "OAuth state is invalid or has expired."
  }
  ```

---

## Local Development

Ensure Node.js 20+ and `pnpm` are installed:

```bash
# Install dependencies
pnpm install

# Start development server with hot-reload (tsx)
pnpm dev
```

The server will listen on `http://localhost:3001`.

### Running Tests

```bash
pnpm test
```

Executes the automated test suite (`tests/server.test.ts`) covering startup validation, state store lifecycle, rate limiting, and mock GitHub token exchange.

---

## Production Deployment

### 1. Compile TypeScript

```bash
pnpm build
```

Compiles all TypeScript files from `src/` to `dist/`. Tests and configuration artifacts are excluded from the output.

### 2. Start Production Server

```bash
pnpm start
```

Runs `node dist/server.js`.

### 3. Deployment Requirements

1. **HTTPS Enforcement**: In production, the server **must** be deployed behind an HTTPS reverse proxy (e.g. Cloudflare, Nginx, Caddy, AWS ALB) or hosted on a PaaS provider with automatic TLS (e.g. Railway, Fly.io, Render). Chrome Extension Manifest V3 rejects non-HTTPS origins in production builds.
2. **Extension ID Alignment**: Each unpacked installation of the Chrome Extension receives an ID based on its installation path. Configure your GitHub OAuth App's Authorization Callback URL to match your extension's redirect URI (`https://<extension-id>.chromiumapp.org/`).
3. **Environment Isolation**: Set `NODE_ENV=production` and `REQUIRE_OAUTH_STATE=true` in production environments.

### 4. Operational & Architectural Limitations

- **In-Memory State Storage**: The current `OAuthStateStore` maintains issued state tokens in local process memory. Consequently, if the service is deployed across multiple load-balanced container replicas or serverless instances without session affinity, state tokens generated on one replica will not be recognized by another. For high-availability multi-instance setups, an external shared store (such as Redis) must be implemented.
- **Single-Tenant vs. Multi-User**: The server acts as a credential proxy for Solohub. It does not store user profiles, passwords, or persistent session databases.
