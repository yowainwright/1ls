import { createFileRoute, Outlet } from '@tanstack/react-router'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { DocsSidebar } from './-components/DocsSidebar'
import Footer from '@/components/sections/footer'

export const Route = createFileRoute('/docs')({
  component: DocsLayout,
})

function DocsLayout() {
  return (
    <>
      <SidebarProvider>
        <DocsSidebar />
        <SidebarInset>
          <main className="relative z-10 flex-1 px-8 py-12">
            <div className="mx-auto max-w-3xl">
              <Outlet />
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
      <Footer className="relative z-10" />
    </>
  )
}
