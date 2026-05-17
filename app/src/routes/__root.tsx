import { lazy, Suspense } from "react";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { queryClient } from "@/lib/query";

const ShaderBackground = lazy(() => import("@/components/ShaderBackground"));

const Devtools = import.meta.env.DEV
  ? lazy(async () => {
      const [{ TanStackRouterDevtools }, { ReactQueryDevtools }] = await Promise.all([
        import("@tanstack/router-devtools"),
        import("@tanstack/react-query-devtools"),
      ]);

      return {
        default: () => (
          <>
            <TanStackRouterDevtools position="bottom-right" />
            <ReactQueryDevtools initialIsOpen={false} />
          </>
        ),
      };
    })
  : null;

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="relative min-h-screen bg-background">
        <Suspense fallback={<div className="shader-background" aria-hidden="true" />}>
          <ShaderBackground />
        </Suspense>
        <div className="relative z-10">
          <Navbar />
          <Outlet />
        </div>
        {Devtools && (
          <Suspense>
            <Devtools />
          </Suspense>
        )}
      </div>
    </QueryClientProvider>
  );
}
