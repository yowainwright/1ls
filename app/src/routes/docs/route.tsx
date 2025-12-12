import { createFileRoute, Outlet } from '@tanstack/react-router'
import { DocsSidebar } from './-components/DocsSidebar'
import { TableOfContents, useHeadings } from '@/components/TableOfContents'
import Footer from '@/components/sections/footer'

export const Route = createFileRoute('/docs')({
  component: DocsLayout,
})

function DocsLayout() {
  return (
    <div className="pt-16">
      <div className="flex min-h-[calc(100vh-4rem)]">
        <DocsSidebar />
        <main className="flex-1 min-w-0">
          <div className="flex">
            <div className="flex-1 px-6 py-12 md:px-12">
              <div className="max-w-[700px] prose prose-invert prose-headings:scroll-mt-24">
                <Outlet />
              </div>
            </div>
            <DocsTableOfContents />
          </div>
        </main>
      </div>
      <Footer className="relative z-10" />
    </div>
  )
}

function DocsTableOfContents() {
  const headings = useHeadings()

  return (
    <aside className="hidden lg:block w-56 shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto border-l border-border/10 py-12 px-4">
      <TableOfContents headings={headings} />
    </aside>
  )
}
