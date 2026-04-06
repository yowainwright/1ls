import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { isSkipped, toRoutePath, collectRoutes, writeRoutes } from "./prerender";

function makeRoutesFixture(base: string): void {
  const mk = (p: string) => mkdirSync(join(base, p), { recursive: true });
  const touch = (p: string) => writeFileSync(join(base, p), "");
  touch("index.tsx");
  touch("playground.tsx");
  touch("__root.tsx");
  touch("route.tsx");
  mk("docs");
  touch("docs/index.tsx");
  touch("docs/route.tsx");
  mk("docs/-components");
  mk("docs/guides");
  touch("docs/guides/index.tsx");
  touch("docs/guides/installation.tsx");
  mk("docs/api");
  touch("docs/api/builtins.tsx");
}

let routesDir = "";

describe("isSkipped", () => {
  test("skips private dirs starting with -", () => {
    expect(isSkipped("-components")).toBe(true);
  });

  test("skips TanStack special files starting with __", () => {
    expect(isSkipped("__root.tsx")).toBe(true);
  });

  test("skips route.tsx and route.ts layout files", () => {
    expect(isSkipped("route.tsx")).toBe(true);
    expect(isSkipped("route.ts")).toBe(true);
  });

  test("does not skip regular route files", () => {
    expect(isSkipped("index.tsx")).toBe(false);
    expect(isSkipped("playground.tsx")).toBe(false);
  });
});

describe("toRoutePath", () => {
  test("strips .tsx extension", () => {
    expect(toRoutePath("index.tsx")).toBe("index");
  });

  test("strips .ts extension", () => {
    expect(toRoutePath("route.ts")).toBe("route");
  });

  test("strips .jsx and .js extensions", () => {
    expect(toRoutePath("page.jsx")).toBe("page");
    expect(toRoutePath("page.js")).toBe("page");
  });
});

describe("collectRoutes", () => {
  beforeEach(() => {
    routesDir = mkdtempSync(join(tmpdir(), "prerender-routes-"));
    makeRoutesFixture(routesDir);
  });

  afterEach(() => {
    rmSync(routesDir, { recursive: true, force: true });
  });

  test("includes root route", () => {
    expect(collectRoutes(routesDir)).toContain("/");
  });

  test("includes top-level routes", () => {
    const routes = collectRoutes(routesDir);
    expect(routes).toContain("/playground");
    expect(routes).toContain("/docs");
  });

  test("includes nested routes", () => {
    const routes = collectRoutes(routesDir);
    expect(routes).toContain("/docs/guides/installation");
    expect(routes).toContain("/docs/guides");
    expect(routes).toContain("/docs/api/builtins");
  });

  test("all routes start with /", () => {
    const routes = collectRoutes(routesDir);
    expect(routes.every((r) => r.startsWith("/"))).toBe(true);
  });

  test("excludes private component dirs", () => {
    const routes = collectRoutes(routesDir);
    expect(routes.every((r) => !r.includes("-components"))).toBe(true);
  });

  test("excludes layout and special files", () => {
    const routes = collectRoutes(routesDir);
    expect(routes.every((r) => !r.includes("__root"))).toBe(true);
    expect(routes.every((r) => !r.includes("/route"))).toBe(true);
  });
});

describe("writeRoutes", () => {
  test("creates index.html for each non-root route", () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "prerender-test-"));
    const html = "<html><body>test</body></html>";

    writeRoutes(["/", "/docs", "/playground"], tmpDir, html);

    expect(existsSync(join(tmpDir, "docs", "index.html"))).toBe(true);
    expect(existsSync(join(tmpDir, "playground", "index.html"))).toBe(true);
  });

  test("writes the correct html content", () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "prerender-test-"));
    const html = "<html><body>test</body></html>";

    writeRoutes(["/docs"], tmpDir, html);

    expect(readFileSync(join(tmpDir, "docs", "index.html"), "utf-8")).toBe(html);
  });

  test("skips writing for the root route", () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "prerender-test-"));

    writeRoutes(["/"], tmpDir, "<html/>");

    expect(existsSync(join(tmpDir, "index.html"))).toBe(false);
  });

  test("creates nested directories as needed", () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "prerender-test-"));

    writeRoutes(["/docs/guides/installation"], tmpDir, "<html/>");

    expect(existsSync(join(tmpDir, "docs", "guides", "installation", "index.html"))).toBe(true);
  });
});
