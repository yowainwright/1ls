#!/usr/bin/env bun

import { startServer, stopServer } from "./server";

export const startDaemon = async (): Promise<void> => {
  process.on("SIGINT", () => {
    stopServer();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    stopServer();
    process.exit(0);
  });

  await startServer();
};

if (import.meta.main) {
  startDaemon().catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Daemon error:", message);
    process.exit(1);
  });
}
