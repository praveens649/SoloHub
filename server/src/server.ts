import { validateConfig } from "./config.js";
import { createApp } from "./app.js";

let config;
try {
  config = validateConfig();
} catch (error) {
  console.error(
    "[Server Startup Error]",
    error instanceof Error ? error.message : "Invalid configuration"
  );
  process.exit(1);
}

const app = createApp(config);

const server = app.listen(config.PORT, () => {
  console.log(
    `Solohub hardened auth server running on port ${config.PORT} [env=${config.NODE_ENV}]`
  );
});

// Graceful shutdown handling
function handleShutdown(signal: string) {
  console.log(`[Server] Received ${signal}. Gracefully closing server...`);
  server.close(() => {
    console.log("[Server] HTTP server closed.");
    process.exit(0);
  });
}

process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));