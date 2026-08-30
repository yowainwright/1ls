import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import {
  isSkipped,
  toRoutePath,
  collectRoutes,
  assertStaticMarkup,
  injectRouteMarkup,
  toHtmlPath,
  writeRoutes,
  type RenderRoute,
} from "./prerender.ts";

const THIS_DIR = dirname(fileURLToPath(import.meta.url));
const TEST_ROOT = join(THIS_DIR, "..", "..", "tmp", "app-prerender");

function makeTestDir(prefix: string): string {
  mkdirSync(TEST_ROOT, { recursive: true });
  return mkdtempSync(join(TEST_ROOT, prefix));
}

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
    assert.strictEqual(isSkipped("-components"), true);
  });

  test("skips TanStack special files starting with __", () => {
    assert.strictEqual(isSkipped("__root.tsx"), true);
  });

  test("skips route.tsx and route.ts layout files", () => {
    assert.strictEqual(isSkipped("route.tsx"), true);
    assert.strictEqual(isSkipped("route.ts"), true);
  });

  test("does not skip regular route files", () => {
    assert.strictEqual(isSkipped("index.tsx"), false);
    assert.strictEqual(isSkipped("playground.tsx"), false);
  });
});

describe("toRoutePath", () => {
  test("strips .tsx extension", () => {
    assert.strictEqual(toRoutePath("index.tsx"), "index");
  });

  test("strips .ts extension", () => {
    assert.strictEqual(toRoutePath("route.ts"), "route");
  });

  test("strips .jsx and .js extensions", () => {
    assert.strictEqual(toRoutePath("page.jsx"), "page");
    assert.strictEqual(toRoutePath("page.js"), "page");
  });
});

describe("collectRoutes", () => {
  beforeEach(() => {
    routesDir = makeTestDir("routes-");
    makeRoutesFixture(routesDir);
  });

  afterEach(() => {
    rmSync(routesDir, { recursive: true, force: true });
  });

  test("includes root route", () => {
    assert.ok(collectRoutes(routesDir).includes("/"));
  });

  test("includes top-level routes", () => {
    const routes = collectRoutes(routesDir);
    assert.ok(routes.includes("/playground"));
    assert.ok(routes.includes("/docs"));
  });

  test("includes nested routes", () => {
    const routes = collectRoutes(routesDir);
    assert.ok(routes.includes("/docs/guides/installation"));
    assert.ok(routes.includes("/docs/guides"));
    assert.ok(routes.includes("/docs/api/builtins"));
  });

  test("all routes start with /", () => {
    const routes = collectRoutes(routesDir);
    assert.strictEqual(routes.every((r) => r.startsWith("/")), true);
  });

  test("excludes private component dirs", () => {
    const routes = collectRoutes(routesDir);
    assert.strictEqual(routes.every((r) => !r.includes("-components")), true);
  });

  test("excludes layout and special files", () => {
    const routes = collectRoutes(routesDir);
    assert.strictEqual(routes.every((r) => !r.includes("__root")), true);
    assert.strictEqual(routes.every((r) => !r.includes("/route")), true);
  });
});

describe("writeRoutes", () => {
  const renderRoute: RenderRoute = async (route) => `<main>${route}</main>`;

  test("creates index.html for each route", async () => {
    const tmpDir = makeTestDir("write-routes-");
    const html = '<html><body><div id="root"></div></body></html>';

    await writeRoutes(["/", "/docs", "/playground"], tmpDir, html, renderRoute);

    assert.strictEqual(existsSync(join(tmpDir, "index.html")), true);
    assert.strictEqual(existsSync(join(tmpDir, "docs", "index.html")), true);
    assert.strictEqual(existsSync(join(tmpDir, "playground", "index.html")), true);
  });

  test("writes rendered route content", async () => {
    const tmpDir = makeTestDir("rendered-route-");
    const html = '<html><body><div id="root"></div></body></html>';

    await writeRoutes(["/docs"], tmpDir, html, renderRoute);

    assert.ok(readFileSync(join(tmpDir, "docs", "index.html"), "utf-8").includes('<div id="root"><main>/docs</main></div>',));
  });

  test("creates nested directories as needed", async () => {
    const tmpDir = makeTestDir("nested-routes-");
    const html = '<html><body><div id="root"></div></body></html>';

    await writeRoutes(["/docs/guides/installation"], tmpDir, html, renderRoute);

    assert.strictEqual(existsSync(join(tmpDir, "docs", "guides", "installation", "index.html")), true);
  });
});

describe("injectRouteMarkup", () => {
  test("injects rendered markup into the app root", () => {
    const html = '<html><body><div id="root"></div></body></html>';

    assert.ok(injectRouteMarkup(html, "<main>Static content</main>").includes('<div id="root"><main>Static content</main></div>',));
  });

  test("rejects a template without an app root", () => {
    assert.throws(() => injectRouteMarkup("<html></html>", "content"), /root element/);
  });
});

describe("assertStaticMarkup", () => {
  test("accepts resolved route content", () => {
    assert.doesNotThrow(() => assertStaticMarkup("<main>Static content</main>"));
  });

  test("rejects empty route content", () => {
    assert.throws(() => assertStaticMarkup("  "), /empty/);
  });

  test("rejects deferred React content", () => {
    assert.throws(() => assertStaticMarkup('<template id="B:0"></template>'), /deferred content/);
  });
});

describe("toHtmlPath", () => {
  test("maps the root route to the root index", () => {
    assert.strictEqual(toHtmlPath("/", "/dist"), "/dist/index.html");
  });

  test("maps nested routes to nested indexes", () => {
    assert.strictEqual(toHtmlPath("/docs/guides", "/dist"), "/dist/docs/guides/index.html");
  });
});
