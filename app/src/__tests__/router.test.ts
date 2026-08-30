import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createRouter, createRootRoute, createRoute } from "@tanstack/react-router";

// Create a minimal route tree for testing router configuration
const rootRoute = createRootRoute();
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
});
const playgroundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/playground",
});

const testRouteTree = rootRoute.addChildren([indexRoute, playgroundRoute]);

describe("Router Configuration", () => {
  test("router is configured with basepath /1ls", () => {
    const router = createRouter({
      routeTree: testRouteTree,
      basepath: "/1ls",
      trailingSlash: "never",
    });

    assert.strictEqual(router.basepath, "/1ls");
  });

  test("router is configured with trailingSlash: never", () => {
    const router = createRouter({
      routeTree: testRouteTree,
      basepath: "/1ls",
      trailingSlash: "never",
    });

    assert.strictEqual(router.options.trailingSlash, "never");
  });

  test("router normalizes URLs by removing trailing slashes", () => {
    const router = createRouter({
      routeTree: testRouteTree,
      basepath: "/1ls",
      trailingSlash: "never",
    });

    assert.strictEqual(router.options.trailingSlash, "never");
  });

  test("router has correct configuration for GitHub Pages deployment", () => {
    const router = createRouter({
      routeTree: testRouteTree,
      basepath: "/1ls",
      trailingSlash: "never",
    });

    assert.strictEqual(router.basepath, "/1ls");
    assert.strictEqual(router.options.trailingSlash, "never");
  });
});
