import { StrictMode, type ReactNode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { createAppRouter } from "./router";
import "./index.css";

function getRoot(): HTMLElement {
  const root = document.getElementById("root");
  if (!root) throw new Error("Root element not found");
  return root;
}

function mountApp(root: HTMLElement, app: ReactNode): void {
  if (root.hasChildNodes()) {
    hydrateRoot(root, app);
    return;
  }

  createRoot(root).render(app);
}

const router = createAppRouter();
await router.load();

const app = (
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);

mountApp(getRoot(), app);
