import { createElement, StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { prerender } from "react-dom/static";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { createAppRouter } from "./router";

const BASE_PATH = "/1ls";

const toHref = (route: string): string => `${BASE_PATH}${route}`;

export async function renderRoute(route: string) {
  const router = createAppRouter();
  const history = createMemoryHistory({ initialEntries: [toHref(route)] });

  router.update({ history });
  await router.load();

  const routerProvider = createElement(RouterProvider, { router });
  const app = createElement(StrictMode, null, routerProvider);
  const { prelude } = await prerender(app);

  await prelude.cancel();
  return renderToString(app);
}
