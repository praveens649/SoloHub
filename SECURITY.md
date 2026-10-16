# Security Policy

The Solohub project takes security seriously. This document outlines how to report security vulnerabilities, how the application handles sensitive credentials, and important security considerations for maintainers and users.

---

## Reporting a Vulnerability

If you discover a security vulnerability in Solohub or its companion authentication server:

- **Do NOT open a public GitHub Issue, Discussion, or Pull Request.**
- Please use GitHub's private vulnerability reporting feature:
  1. Navigate to the repository on GitHub.
  2. Click on the **Security** tab.
  3. Under **Reporting**, click **Report a vulnerability** to submit a private advisory.

> **Note to Repository Maintainers**: If GitHub Private Vulnerability Reporting is not yet enabled on your fork or repository, enable it under **Settings → Code security and analysis → Private vulnerability reporting**, or designate a secure, private contact channel before making the repository public.

### What to Include in a Report

To help us investigate and remediate the issue promptly, please include:
- A clear description of the vulnerability and its potential impact.
- Step-by-step instructions or a minimal proof-of-concept (PoC) demonstrating how to reproduce the issue.
- The environment details (e.g. Chrome browser version, OS, extension version, and backend configuration).
- Any suggested mitigations or patches, if available.

---

## Security Model & Credential Protection

### 1. Token Storage in the Chrome Extension
- **`chrome.storage.local`**: Solohub persists authentication credentials (Personal Access Tokens or OAuth Access Tokens) in Chrome's extension-specific local storage (`chrome.storage.local`).
- **Unencrypted Storage Disclosure**: Solohub does **not** encrypt tokens stored in `chrome.storage.local`. Storage is isolated by the browser's extension sandbox, preventing web pages and other standard extensions from reading it. However, any software running locally on the user's host machine with filesystem access to Chrome's profile directory can read unencrypted profile data.
- **User Protection Recommendation**:
  - Only run Solohub on trusted personal or corporate devices that employ full-disk encryption (e.g. BitLocker, FileVault).
  - Use GitHub Personal Access Tokens (PAT) with the minimal necessary scopes (`repo`, `read:user`, `notifications`).
  - Set an explicit expiration date on Personal Access Tokens.
  - If you suspect your device has been compromised, revoke the token immediately via [GitHub Token Settings](https://github.com/settings/tokens).

### 2. Personal Access Tokens (PAT) vs. OAuth
- Solohub supports **Direct PAT Authentication** where your token is sent directly and exclusively from the extension to `https://api.github.com`. No intermediate server or third party ever receives your token.
- When using **OAuth**, the token exchange requires a companion backend server holding your `GITHUB_CLIENT_SECRET`. Once exchanged, the resulting OAuth access token is stored locally in the extension and used directly with GitHub.

### 3. Server-Side Secret Management
- **Never Commit Secrets**: The GitHub OAuth Client Secret (`GITHUB_CLIENT_SECRET`) must reside exclusively on the backend server via environment variables or secret managers. It must **never** be included in frontend code, client builds, extension manifests, or public repositories.
- **Git History Hygiene**: Before publishing or open-sourcing a repository, audit all Git history for previously committed credentials. If a secret was ever committed to Git in any past commit, **the secret must be immediately rotated and revoked in GitHub**, as removing files in later commits does not purge historical Git objects.

### 4. Public Communications
- **Never share credentials**: Never paste Personal Access Tokens, OAuth secrets, authorization codes, or `.env` files into public issue trackers, forum posts, pull request comments, or chat platforms. Maintainers and contributors will never ask you for your private token.
