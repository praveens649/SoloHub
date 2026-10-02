import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,

  name: "Solohub",

  version: "0.1.0",

  description:
    "A productivity GitHub control center for solo developers.",

  permissions: ["storage","identity"],
  host_permissions: [
  "http://localhost:3001/*",
],

  action: {
    default_popup: "index.html",
  },

  background: {
    service_worker: "src/background/service-worker.ts",
    type: "module",
  },
});