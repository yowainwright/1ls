import { describe, expect, test } from "bun:test";
import config from "./vite.config";

describe("vite config", () => {
  test("keeps the chunk warning budget above the known syntax-highlighting chunks", () => {
    expect(config.build?.chunkSizeWarningLimit).toBeGreaterThanOrEqual(1024);
  });
});
