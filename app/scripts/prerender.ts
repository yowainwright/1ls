import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const ROUTES_DIR = join(import.meta.dir, "../src/routes");
const DIST_DIR = join(import.meta.dir, "../dist");

export const isSkipped = (name: string): boolean =>
  name.startsWith("-") || name.startsWith("__") || name === "route.tsx" || name === "route.ts";

export const toRoutePath = (name: string): string =>
  name.replace(/\.(tsx|ts|jsx|js)$/, "");

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

export function writeRoutes(routes: string[], distDir: string, indexHtml: string): void {
  routes
    .filter((route) => route !== "/")
    .forEach((route) => {
      const routeDir = join(distDir, route);
      mkdirSync(routeDir, { recursive: true });
      writeFileSync(join(routeDir, "index.html"), indexHtml);
      console.log(`prerendered: ${route}`);
    });
}

if (import.meta.main) {
  const indexHtml = readFileSync(join(DIST_DIR, "index.html"), "utf-8");
  writeRoutes(collectRoutes(ROUTES_DIR), DIST_DIR, indexHtml);
}
