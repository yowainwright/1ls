import { createFileRoute, Outlet } from '@tanstack/react-router'
import { DocsSidebar } from './-components/DocsSidebar'
import { TableOfContents, useHeadings } from '@/components/TableOfContents'
import Footer from '@/components/sections/footer'

export const Route = createFileRoute('/docs')({
  component: DocsLayout,
})

function DocsLayout() {
  const headings = useHeadings()

  return (
    <div className="pt-16 min-h-screen">
      <div className="grid grid-cols-[auto_1fr_auto]">
        <DocsSidebar />
        <main className="min-w-0 px-6 pt-6 pb-12 md:px-12">
          <div className="max-w-[700px] mx-auto prose prose-invert prose-headings:scroll-mt-24">
            <Outlet />
          </div>
        </main>
        <div className="hidden lg:block w-56">
          <div className="sticky top-20 pt-6 pb-12 px-4">
            <TableOfContents headings={headings} />
          </div>
        </div>
      </div>
      <Footer className="relative z-10" />
    </div>
  )
}
