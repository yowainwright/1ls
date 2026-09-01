import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, beforeEach, describe, test } from "node:test";

import { RELEASE_ASSETS, buildReleaseManifest } from "../../../scripts/release";

const TEST_ROOT = join(import.meta.dirname, "../../../tmp/release-manifest");

let tmp = "";

beforeEach(async () => {
  await mkdir(TEST_ROOT, { recursive: true });
  tmp = await mkdtemp(join(TEST_ROOT, "case-"));
});

afterEach(async () => {
  await rm(tmp, { recursive: true, force: true });
});

const writeAsset = async (name: string) => {
  const content = `binary:${name}`;
  await writeFile(join(tmp, name), content);
  return createHash("sha256").update(content).digest("hex");
};

describe("release manifest", () => {
  test("describes the Homebrew release asset contract", async () => {
    const expectedHashes = new Map<string, string>();

    await Promise.all(RELEASE_ASSETS.map(async (asset) => {
      expectedHashes.set(asset.name, await writeAsset(asset.name));
    }));

    const manifest = await buildReleaseManifest(tmp, "0.1.15");
    const names = manifest.assets.map((asset) => asset.name);

    assert.deepEqual(names, [
      "1ls-darwin-arm64",
      "1ls-darwin-x64",
      "1ls-linux-arm64",
      "1ls-linux-x64",
    ]);
    assert.equal(manifest.name, "1ls");
    assert.equal(manifest.version, "0.1.15");
    assert.equal(manifest.tag, "v0.1.15");

    manifest.assets.forEach((asset) => {
      assert.equal(asset.sha256, expectedHashes.get(asset.name));
      assert.equal(asset.size, `binary:${asset.name}`.length);
    });
  });

  test("fails when a release asset is missing", async () => {
    await assert.rejects(buildReleaseManifest(tmp, "0.1.15"), /ENOENT/);
  });
});
