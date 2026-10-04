import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,

  name: "Solohub",

  version: "0.1.0",

  description:
    "A productivity GitHub control center for solo developers.",

  icons: {
    "16": "icons/icon-16.png",
    "32": "icons/icon-32.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png",
  },

  permissions: ["storage", "identity", "tabs"],
  host_permissions: [
    "http://localhost:3001/*",
  ],

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