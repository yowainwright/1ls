import { createFileRoute, Outlet } from '@tanstack/react-router'
import { DocsSidebar } from './-components/DocsSidebar'
import Footer from '@/components/sections/footer'

export const Route = createFileRoute('/docs')({
  component: DocsLayout,
})

function DocsLayout() {
  return (
    <div className="pt-16">
      <div className="flex min-h-[calc(100vh-4rem)]">
        <DocsSidebar />
        <main className="flex-1 overflow-hidden">
          <div className="px-8 py-12">
            <div className="mx-auto max-w-3xl">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
      <Footer className="relative z-10" />
    </div>
  )
}
