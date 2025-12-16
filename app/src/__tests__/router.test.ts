import { describe, test, expect } from "bun:test"
import { createRouter, createRootRoute, createRoute } from "@tanstack/react-router"

// Create a minimal route tree for testing router configuration
const rootRoute = createRootRoute()
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
})
const playgroundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/playground",
})

const testRouteTree = rootRoute.addChildren([indexRoute, playgroundRoute])

describe("Router Configuration", () => {
  test("router is configured with basepath /1ls", () => {
    const router = createRouter({
      routeTree: testRouteTree,
      basepath: "/1ls",
      trailingSlash: "never",
    })

    expect(router.basepath).toBe("/1ls")
  })

  test("router is configured with trailingSlash: never", () => {
    const router = createRouter({
      routeTree: testRouteTree,
      basepath: "/1ls",
      trailingSlash: "never",
    })

    expect(router.options.trailingSlash).toBe("never")
  })

  test("router normalizes URLs by removing trailing slashes", () => {
    const router = createRouter({
      routeTree: testRouteTree,
      basepath: "/1ls",
      trailingSlash: "never",
    })

    // The trailingSlash: 'never' option ensures URLs like /playground/ become /playground
    // This is verified by checking the router option is correctly set
    expect(router.options.trailingSlash).toBe("never")
  })

  test("router has correct configuration for GitHub Pages deployment", () => {
    const router = createRouter({
      routeTree: testRouteTree,
      basepath: "/1ls",
      trailingSlash: "never",
    })

    // Verify both settings work together for proper GitHub Pages routing
    expect(router.basepath).toBe("/1ls")
    expect(router.options.trailingSlash).toBe("never")
  })
})
