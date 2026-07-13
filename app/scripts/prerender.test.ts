import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  isSkipped,
  toRoutePath,
  collectRoutes,
  assertStaticMarkup,
  injectRouteMarkup,
  toHtmlPath,
  writeRoutes,
  type RenderRoute,
} from "./prerender";

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
  const renderRoute: RenderRoute = async (route) => `<main>${route}</main>`;

  test("creates index.html for each route", async () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "prerender-test-"));
    const html = '<html><body><div id="root"></div></body></html>';

    await writeRoutes(["/", "/docs", "/playground"], tmpDir, html, renderRoute);

    expect(existsSync(join(tmpDir, "index.html"))).toBe(true);
    expect(existsSync(join(tmpDir, "docs", "index.html"))).toBe(true);
    expect(existsSync(join(tmpDir, "playground", "index.html"))).toBe(true);
  });

  test("writes rendered route content", async () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "prerender-test-"));
    const html = '<html><body><div id="root"></div></body></html>';

    await writeRoutes(["/docs"], tmpDir, html, renderRoute);

    expect(readFileSync(join(tmpDir, "docs", "index.html"), "utf-8")).toContain(
      '<div id="root"><main>/docs</main></div>',
    );
  });

  test("creates nested directories as needed", async () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "prerender-test-"));
    const html = '<html><body><div id="root"></div></body></html>';

    await writeRoutes(["/docs/guides/installation"], tmpDir, html, renderRoute);

    expect(existsSync(join(tmpDir, "docs", "guides", "installation", "index.html"))).toBe(true);
  });
});

describe("injectRouteMarkup", () => {
  test("injects rendered markup into the app root", () => {
    const html = '<html><body><div id="root"></div></body></html>';

    expect(injectRouteMarkup(html, "<main>Static content</main>")).toContain(
      '<div id="root"><main>Static content</main></div>',
    );
  });

  test("rejects a template without an app root", () => {
    expect(() => injectRouteMarkup("<html></html>", "content")).toThrow("root element");
  });
});

describe("assertStaticMarkup", () => {
  test("accepts resolved route content", () => {
    expect(() => assertStaticMarkup("<main>Static content</main>")).not.toThrow();
  });

  test("rejects empty route content", () => {
    expect(() => assertStaticMarkup("  ")).toThrow("empty");
  });

  test("rejects deferred React content", () => {
    expect(() => assertStaticMarkup('<template id="B:0"></template>')).toThrow("deferred content");
  });
});

describe("toHtmlPath", () => {
  test("maps the root route to the root index", () => {
    expect(toHtmlPath("/", "/dist")).toBe("/dist/index.html");
  });

  test("maps nested routes to nested indexes", () => {
    expect(toHtmlPath("/docs/guides", "/dist")).toBe("/dist/docs/guides/index.html");
  });
});
