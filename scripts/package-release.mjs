/**
 * Solohub Release Packaging Script
 *
 * Verifies the production build artifact in dist/ and packages it into a
 * clean, versioned ZIP archive suitable for Chrome "Load unpacked" distribution.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";

const rootDir = process.cwd();
const distDir = path.join(rootDir, "dist");
const releaseDir = path.join(rootDir, "release");
const packageJsonPath = path.join(rootDir, "package.json");

// 1. Read package version
if (!fs.existsSync(packageJsonPath)) {
  console.error("Error: package.json not found.");
  process.exit(1);
}
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
const version = pkg.version || "0.1.0";
const zipName = `solohub-v${version}.zip`;
const zipPath = path.join(releaseDir, zipName);
const shaPath = path.join(releaseDir, `${zipName}.sha256`);

console.log(`[Release Packager] Packaging Solohub v${version}...`);

// 2. Verify dist directory exists
if (!fs.existsSync(distDir)) {
  console.error("Error: dist/ directory not found. Please run 'pnpm build' first.");
  process.exit(1);
}

// 3. Verify manifest.json
const manifestPath = path.join(distDir, "manifest.json");
if (!fs.existsSync(manifestPath)) {
  console.error("Error: dist/manifest.json not found.");
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

if (manifest.manifest_version !== 3) {
  console.error("Error: manifest_version must be 3.");
  process.exit(1);
}

if (manifest.permissions?.includes("tabs")) {
  console.error("Error: 'tabs' permission detected in production manifest. Must be removed.");
  process.exit(1);
}

for (const host of manifest.host_permissions || []) {
  if (host.includes("localhost") || host.startsWith("http://")) {
    console.error(`Error: Insecure host permission detected in production: ${host}`);
    process.exit(1);
  }
}

// 4. Verify required assets
const requiredFiles = [
  "index.html",
  "service-worker-loader.js",
  "icons/icon-16.png",
  "icons/icon-32.png",
  "icons/icon-48.png",
  "icons/icon-128.png",
];

for (const relFile of requiredFiles) {
  const fullPath = path.join(distDir, relFile);
  if (!fs.existsSync(fullPath)) {
    console.error(`Error: Required extension asset missing in dist/: ${relFile}`);
    process.exit(1);
  }
}

// 5. Verify no development server references remain
const indexHtmlContent = fs.readFileSync(path.join(distDir, "index.html"), "utf-8");
if (indexHtmlContent.includes("CRXJS DEV MODE") || indexHtmlContent.includes("localhost:5173")) {
  console.error("Error: Development server stub detected in dist/index.html.");
  process.exit(1);
}

const swLoaderContent = fs.readFileSync(path.join(distDir, "service-worker-loader.js"), "utf-8");
if (swLoaderContent.includes("localhost:5173")) {
  console.error("Error: Development server import detected in dist/service-worker-loader.js.");
  process.exit(1);
}

// 6. Secret scan of all bundled files in dist/
const realTokenPattern = /\b(ghp_[a-zA-Z0-9]{30,}|gho_[a-zA-Z0-9]{30,}|github_pat_[a-zA-Z0-9_]{50,})\b/;
const clientSecretPattern = /client_secret\s*[:=]\s*["'][a-zA-Z0-9_\-]{20,}["']/;

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith(".js") || entry.name.endsWith(".json") || entry.name.endsWith(".html"))) {
      const content = fs.readFileSync(fullPath, "utf-8");
      
      const tokenMatch = content.match(realTokenPattern);
      if (tokenMatch && tokenMatch[0] !== "ghp_xxxxxxxxxxxxxxxxxxxx") {
        console.error(`Error: Potential live credential detected in bundled file: ${path.relative(rootDir, fullPath)}`);
        process.exit(1);
      }

      if (clientSecretPattern.test(content)) {
        console.error(`Error: Potential client secret detected in bundled file: ${path.relative(rootDir, fullPath)}`);
        process.exit(1);
      }
    }
  }
}
scanDirectory(distDir);

// 7. Ensure release directory exists
if (!fs.existsSync(releaseDir)) {
  fs.mkdirSync(releaseDir, { recursive: true });
}

// Remove old zip if present
if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

// 8. Create ZIP archive
try {
  if (process.platform === "win32") {
    // Windows PowerShell Compress-Archive
    execSync(
      `powershell -NoProfile -Command "Compress-Archive -Path '${distDir}\\*' -DestinationPath '${zipPath}' -Force"`,
      { stdio: "inherit" }
    );
  } else {
    // Unix zip
    execSync(`cd "${distDir}" && zip -r "${zipPath}" ./*`, { stdio: "inherit" });
  }
} catch (archiveErr) {
  console.error("Failed to create ZIP archive:", archiveErr);
  process.exit(1);
}

if (!fs.existsSync(zipPath) || fs.statSync(zipPath).size === 0) {
  console.error("Error: Output ZIP was not created or is empty.");
  process.exit(1);
}

// 9. Generate SHA-256 Checksum
const zipBuffer = fs.readFileSync(zipPath);
const sha256 = crypto.createHash("sha256").update(zipBuffer).digest("hex");
fs.writeFileSync(shaPath, `${sha256}  ${zipName}\n`);

const zipSizeKb = (fs.statSync(zipPath).size / 1024).toFixed(2);

console.log("\n[Release Packager] SUCCESS!");
console.log(`- Release Archive: ${zipPath} (${zipSizeKb} KB)`);
console.log(`- SHA-256 Checksum: ${sha256}`);
console.log(`- Checksum File:   ${shaPath}`);
console.log("- ZIP Structure:   manifest.json is located at the root of the archive.");
