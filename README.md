# Solohub

> **A high-productivity GitHub control center for solo developers, built as a Manifest V3 Chrome Extension.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.x-blue.svg)](https://react.dev/)
[![Manifest V3](https://img.shields.io/badge/Chrome-Manifest_V3-green.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Solohub puts your GitHub repositories, active pull requests, issues, notifications, and productivity metrics directly into your browser toolbar. Designed specifically for solo developers, open-source maintainers, and independent creators who need fast, context-rich visibility without context-switching between tabs.

---

## Features

- **Personalized Control Center**: Instant overview of your active repositories, commit activity streaks, pull request velocity, and weekly productivity metrics.
- **Repository Management**: Search, filter, and inspect personal and organization repositories. View branch details, collaborator roles, open issues, and pull request counts.
- **Issue Tracking & Creation**: Browse assigned and open issues across repositories, filter by status, and create new issues with labels and assignees directly from the popup.
- **Pull Request Monitor**: Track open, draft, and closed PRs across your projects. Inspect review statuses, CI/CD checks, and merge states in real-time.
- **Action Center / Inbox**: Aggregates actionable items into one high-priority feed: pending review requests, failing CI workflows, unresolved mentions, and stale pull requests.
- **Command Palette (`Ctrl+K` / `Cmd+K`)**: Rapid keyboard-driven navigation to search repositories, jump to issues, trigger quick actions, or toggle views without touching the mouse.
- **Developer Quick Actions**: One-click shortcuts for creating repositories, filing quick issues, inspecting rate-limits, and opening repository web pages.
- **Dual Authentication Modes**:
  - **Direct PAT (Personal Access Token)**: Zero configuration required. Communicates directly with GitHub's REST API. No backend server needed.
  - **GitHub OAuth 2.0 Flow**: Optional web authentication using a self-hosted companion backend proxy for secure authorization code grant.

---

## Screenshots

> *Placeholder: Visual previews of Solohub in action.*

```
┌────────────────────────────────────────────────────────┐
│ [Screenshot: Solohub Dashboard & Productivity View]     │
│ (Coming soon - capture from unpacked extension popup)  │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ [Screenshot: Command Palette & Quick Actions]          │
│ (Coming soon - capture from Ctrl+K palette modal)      │
└────────────────────────────────────────────────────────┘
```

---

## Architecture & Technology Stack

Solohub is engineered for speed, privacy, and minimal browser resource usage:

- **Frontend**: React 19, TypeScript, Tailwind CSS, TanStack Query v5, Lucide Icons.
- **Build System**: Vite 8 with `@crxjs/vite-plugin` for Chrome Manifest V3 bundling.
- **GitHub API Integration**: Direct HTTPS requests to `https://api.github.com` with automatic rate-limit tracking, exponential backoff, and pagination.
- **Companion Backend (Optional)**: Node.js, Express 5, Helmet, CORS, and `express-rate-limit` for secure OAuth 2.0 authorization code exchange.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                 BROWSER                                 │
│                                                                         │
│  ┌────────────────────────────────┐   Direct REST API (PAT Mode)        │
│  │     Solohub Chrome Extension   ├──────────────────────────────────┐  │
│  │   (Manifest V3 / React Popup)  │                                  │  │
│  └───────────────┬────────────────┘                                  │  │
│                  │                                                   │  │
│                  │ OAuth Exchange (Optional)                         │  │
│                  ▼                                                   │  │
└──────────────────┼───────────────────────────────────────────────────┼──┘
                   │                                                   │
                   ▼                                                   ▼
┌──────────────────────────────────────┐             ┌─────────────────────┐
│  Solohub Auth Backend (Optional)     │             │   GitHub REST API   │
│  (Holds GITHUB_CLIENT_SECRET)        ├────────────►│ https://api.github  │
└──────────────────────────────────────┘             └─────────────────────┘
```

---

## Installation via Chrome Developer Mode (Unpacked)

Solohub is distributed via GitHub Releases as an unpacked ZIP archive. It is not currently published on the Chrome Web Store.

### Step-by-Step Instructions

1. **Download the Release Artifact**:
   - Go to the [Releases](https://github.com/your-username/solohub/releases) page.
   - Download the latest `solohub-v<version>.zip` and its companion checksum file `solohub-v<version>.zip.sha256`.
2. **Verify Checksum (Optional but Recommended)**:
   ```bash
   sha256sum -c solohub-v0.1.0.zip.sha256
   # Or in PowerShell:
   Get-FileHash -Algorithm SHA256 solohub-v0.1.0.zip
   ```
3. **Extract the ZIP Archive**:
   - Extract `solohub-v<version>.zip` into a permanent directory on your computer (e.g., `C:\Extensions\Solohub` or `~/Extensions/Solohub`).
   - Confirm that `manifest.json` is located directly inside the root of the extracted folder.
4. **Load into Google Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`.
   - Enable the **Developer mode** toggle in the upper-right corner.
   - Click the **Load unpacked** button in the top toolbar.
   - Select the folder containing `manifest.json`.
5. **Pin & Launch**:
   - Click the Extensions puzzle piece icon in the Chrome toolbar.
   - Pin **Solohub** to your toolbar and click the icon to launch the control center.

---

## Authentication Setup

Solohub offers two authentication options:

### Option 1: Direct Personal Access Token (Recommended)

This is the fastest, easiest, and most secure method for individual solo developers. It requires **zero backend infrastructure**.

1. Go to [GitHub Token Settings](https://github.com/settings/tokens/new) (Classic Tokens).
2. Give your token a descriptive note (e.g., `Solohub Chrome Extension`).
3. Set an expiration date.
4. Select the following required scopes:
   - `repo`: Required to view repositories, branches, open PRs, manage collaborators, and file issues.
   - `read:user`: Required to fetch your profile information, avatar, and username.
   - `notifications`: Required for the Action Center to show pending notifications and review requests.
5. Click **Generate token** and copy the string (`ghp_...`).
6. Open Solohub, paste the token into the **Personal Access Token** field, and click **Connect Token**.

> **Security Reminder**: Never paste your Personal Access Token into public issue trackers, pull requests, or chats. Solohub stores your token locally in `chrome.storage.local`.

---

### Option 2: GitHub OAuth 2.0 (Self-Hosted)

If you prefer logging in via the standard GitHub OAuth authorization screen, you must run the companion authentication server:

1. **Register a GitHub OAuth App**:
   - Go to [GitHub Developer Settings → OAuth Apps → New OAuth App](https://github.com/settings/applications/new).
   - Set **Application Name** to `Solohub`.
   - Set **Homepage URL** to your project repository or site.
   - Set **Authorization callback URL** to:
     ```text
     https://<your-extension-id>.chromiumapp.org/
     ```
     *(You can find your extension ID on `chrome://extensions` after loading the unpacked extension).*
2. **Deploy the Companion Backend**:
   - Follow the deployment instructions in [`server/README.md`](server/README.md).
   - Deploy the server to an HTTPS-enabled host (e.g. Railway, Render, Fly.io, or VPS behind Nginx).
3. **Build the Extension with Backend Configuration**:
   - Set `VITE_GITHUB_CLIENT_ID` and `VITE_BACKEND_URL` in your `.env.local`:
     ```dotenv
     VITE_GITHUB_CLIENT_ID=your_oauth_client_id
     VITE_BACKEND_URL=https://auth.yourdomain.com
     ```
   - Rebuild the extension (`pnpm build`).

> **Note on Chrome Extension IDs**: Unpacked Chrome extensions calculate their extension ID based on the absolute path of the directory on your computer. Because different machines install unpacked extensions into different paths, OAuth App callback URLs must match the specific extension ID of the installed machine.

---

## Configuration Reference

The following environment variables configure the Solohub extension during build time:

| Environment Variable | Where Configured | Exposure | Purpose |
| :--- | :--- | :--- | :--- |
| `VITE_GITHUB_CLIENT_ID` | `.env.local` / Build env | **Public** (inlined in client bundle) | The public OAuth App Client ID used to initiate the OAuth flow. |
| `VITE_BACKEND_URL` | `.env.local` / Build env | **Public** (inlined in client bundle) | The URL of the token exchange server. Must use `https://` in production builds. |

> **Critical Security Rule**: `GITHUB_CLIENT_SECRET` must **never** be added to the frontend `.env` or client files. It belongs exclusively on the backend server.

---

## Local Development & Contributing

### Prerequisites

- [Node.js](https://nodejs.org/) v20 or higher
- [pnpm](https://pnpm.io/) v9 or v10 (`npm install -g pnpm`)

### Setup Commands

```bash
# Clone the repository
git clone https://github.com/your-username/solohub.git
cd solohub

# Install frontend dependencies
pnpm install

# Start extension in development mode
pnpm dev
```

### Verification Scripts

Run the verification suite before opening pull requests:

```bash
# Run linting
pnpm lint

# Run frontend tests
pnpm test

# Build production bundle
pnpm build

# Generate verifiable release ZIP artifact
pnpm run package
```

To run the backend test suite:
```bash
cd server
pnpm test
pnpm build
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for full contribution guidelines.

---

## Data Privacy & Security

- **Local-Only Storage**: All user preferences, repository caches, and authentication tokens are stored exclusively on your device inside `chrome.storage.local`.
- **No Analytics / Telemetry**: Solohub does not track you, does not load third-party analytics scripts, and does not sell or share data.
- **Direct Communication**: In PAT mode, network requests flow exclusively between your browser and `https://api.github.com`.
- **Unencrypted Local Profile**: As with standard Chrome extensions, tokens stored in `chrome.storage.local` are isolated by the browser sandbox, but are not encrypted at rest on your physical hard drive. Maintainers recommend using disk-level encryption (BitLocker/FileVault) on development machines.

For vulnerability reporting and detailed security disclosures, see [SECURITY.md](SECURITY.md).

---

## Troubleshooting

- **Extension fails to load / "Manifest file is missing"**: Ensure that when clicking **Load unpacked**, you select the folder containing `manifest.json`, not the parent release directory.
- **"Bad credentials" (401 Error)**: Your Personal Access Token has expired or was revoked. Generate a new token with `repo`, `read:user`, and `notifications` scopes in GitHub and update it in Settings.
- **GitHub Rate Limit Warning**: Unauthenticated requests to GitHub are strictly limited. Ensure you are signed in with a valid PAT or OAuth token (authenticated users receive 5,000 requests/hour).
- **OAuth Callback Mismatch**: Confirm that the Authorization Callback URL in your GitHub OAuth App settings exactly matches `https://<your-extension-id>.chromiumapp.org/`.

---

## License

This project is licensed under the [MIT License](LICENSE).