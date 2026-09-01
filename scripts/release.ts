#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { pathToFileURL } from "node:url";

export const RELEASE_ASSETS = [
  { name: "1ls-darwin-arm64", os: "darwin", arch: "arm64" },
  { name: "1ls-darwin-x64", os: "darwin", arch: "x64" },
  { name: "1ls-linux-arm64", os: "linux", arch: "arm64" },
  { name: "1ls-linux-x64", os: "linux", arch: "x64" },
] as const;

type PackageJson = {
  version: string;
};

type ManifestAsset = {
  name: string;
  os: string;
  arch: string;
  sha256: string;
  size: number;
};

export type ReleaseManifest = {
  name: "1ls";
  version: string;
  tag: string;
  assets: ManifestAsset[];
};

const hashBuffer = (content: Buffer) => createHash("sha256").update(content).digest("hex");

const readPackageVersion = async () => {
  const content = await readFile("package.json", "utf8");
  const packageJson = JSON.parse(content) as PackageJson;
  return packageJson.version;
};

const toManifestAsset = async (
  distDir: string,
  asset: (typeof RELEASE_ASSETS)[number],
) => {
  const path = join(distDir, asset.name);
  const content = await readFile(path);

  return {
    name: basename(path),
    os: asset.os,
    arch: asset.arch,
    sha256: hashBuffer(content),
    size: content.byteLength,
  };
};

export const buildReleaseManifest = async (distDir: string, version: string) => {
  const assets = await Promise.all(RELEASE_ASSETS.map((asset) => toManifestAsset(distDir, asset)));

  return {
    name: "1ls",
    version,
    tag: `v${version}`,
    assets,
  } satisfies ReleaseManifest;
};

const writeManifest = async () => {
  const distDir = process.argv[2] ?? "dist";
  const version = process.env.VERSION ?? await readPackageVersion();
  const manifest = await buildReleaseManifest(distDir, version);
  const content = `${JSON.stringify(manifest, null, 2)}\n`;

  await writeFile(join(distDir, "release-manifest.json"), content);
};

const isMain = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;

if (isMain) {
  await writeManifest();
}
