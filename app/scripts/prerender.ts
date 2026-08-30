import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, rmSync } from "fs";
import { dirname, join } from "path";
import { pathToFileURL } from "url";

const ROUTES_DIR = join(import.meta.dirname, "../src/routes");
const DIST_DIR = join(import.meta.dirname, "../dist");
const SSR_DIR = join(import.meta.dirname, "../dist-ssr");
const SSR_ENTRY = join(SSR_DIR, "entry-server.js");
const ROOT_ELEMENT = '<div id="root"></div>';
const NON_STATIC_MARKERS = ['<template id="B:', '<div hidden id="S:', "data-msg="];

export type RenderRoute = (route: string) => Promise<string>;

export const isSkipped = (name: string): boolean =>
  name.startsWith("-") || name.startsWith("__") || name === "route.tsx" || name === "route.ts";

export const toRoutePath = (name: string): string => name.replace(/\.(tsx|ts|jsx|js)$/, "");

export function collectRoutes(dir: string, base = ""): string[] {
  return readdirSync(dir).flatMap((entry) => {
    if (isSkipped(entry)) return [];

    const fullPath = join(dir, entry);
    const isDir = statSync(fullPath).isDirectory();

    if (isDir) return collectRoutes(fullPath, `${base}/${entry}`);

    if (!/\.(tsx|ts|jsx|js)$/.test(entry)) return [];

    const name = toRoutePath(entry);
    return name === "index" ? [base || "/"] : [`${base}/${name}`];
  });
}

export function injectRouteMarkup(indexHtml: string, markup: string): string {
  if (!indexHtml.includes(ROOT_ELEMENT)) {
    throw new Error("Built index.html is missing the root element");
  }

  return indexHtml.replace(ROOT_ELEMENT, `<div id="root">${markup}</div>`);
}

export function toHtmlPath(route: string, distDir: string): string {
  const routePath = route === "/" ? "" : route.slice(1);
  return join(distDir, routePath, "index.html");
}

export function assertStaticMarkup(markup: string): void {
  if (!markup.trim()) throw new Error("Prerendered route is empty");

  const hasDeferredContent = NON_STATIC_MARKERS.some((marker) => markup.includes(marker));
  if (hasDeferredContent) throw new Error("Prerendered route contains deferred content");
}

async function writeRoute(
  route: string,
  distDir: string,
  indexHtml: string,
  renderRoute: RenderRoute,
) {
  const htmlPath = toHtmlPath(route, distDir);
  const markup = await renderRoute(route);

  assertStaticMarkup(markup);
  mkdirSync(dirname(htmlPath), { recursive: true });
  writeFileSync(htmlPath, injectRouteMarkup(indexHtml, markup));
  process.stdout.write(`prerendered: ${route}\n`);
}

export function writeRoutes(
  routes: string[],
  distDir: string,
  indexHtml: string,
  renderRoute: RenderRoute,
) {
  return routes.reduce(
    (previous, route) => previous.then(() => writeRoute(route, distDir, indexHtml, renderRoute)),
    Promise.resolve(),
  );
}

if (import.meta.main) {
  const indexHtml = readFileSync(join(DIST_DIR, "index.html"), "utf-8");
  const serverEntryUrl = pathToFileURL(SSR_ENTRY).href;

  try {
    const serverEntry = (await import(serverEntryUrl)) as { renderRoute: RenderRoute };
    await writeRoutes(collectRoutes(ROUTES_DIR), DIST_DIR, indexHtml, serverEntry.renderRoute);
  } finally {
    rmSync(SSR_DIR, { recursive: true, force: true });
  }
}
