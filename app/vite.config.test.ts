import { describe, test } from "node:test";
import assert from "node:assert/strict";
import config from "./vite.config.ts";

describe("vite config", () => {
  test("keeps the chunk warning budget above the known syntax-highlighting chunks", () => {
    assert.ok(config.build?.chunkSizeWarningLimit >= 1024);
  });
});
