import { createRootRoute, Outlet } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { Navbar } from '@/components/Navbar'
import { queryClient } from '@/lib/query'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="relative min-h-screen bg-background">
        <div className="aurora-gradient" />
        <Navbar />
        <Outlet />
        {import.meta.env.DEV && (
          <>
            <TanStackRouterDevtools position="bottom-right" />
            <ReactQueryDevtools initialIsOpen={false} />
          </>
        )}
      </div>
    </QueryClientProvider>
  )
}
