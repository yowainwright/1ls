import { describe, test, expect } from "bun:test";
import { mkdtempSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { isSkipped, toRoutePath, collectRoutes, writeRoutes } from "./prerender";

const ROUTES_DIR = join(import.meta.dir, "../src/routes");

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
  test("includes root route", () => {
    expect(collectRoutes(ROUTES_DIR)).toContain("/");
  });

  test("includes top-level routes", () => {
    const routes = collectRoutes(ROUTES_DIR);
    expect(routes).toContain("/playground");
    expect(routes).toContain("/docs");
  });

  test("includes nested routes", () => {
    const routes = collectRoutes(ROUTES_DIR);
    expect(routes).toContain("/docs/guides/installation");
    expect(routes).toContain("/docs/guides/quick-start");
    expect(routes).toContain("/docs/guides/interactive-mode");
    expect(routes).toContain("/docs/api/builtins");
    expect(routes).toContain("/docs/api/formats");
    expect(routes).toContain("/docs/api/shortcuts");
    expect(routes).toContain("/docs/api/array-methods");
    expect(routes).toContain("/docs/benchmarks");
  });

  test("excludes private component dirs", () => {
    const routes = collectRoutes(ROUTES_DIR);
    expect(routes.every((r) => !r.includes("-components"))).toBe(true);
  });

  test("excludes layout and special files", () => {
    const routes = collectRoutes(ROUTES_DIR);
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
