import { createFileRoute } from '@tanstack/react-router'
import { PageHeader } from '../../-components/PageHeader'
import { Codeblock } from '@/components/Codeblock'
import { ShortcutsTable } from './-components/ShortcutsTable'
import { CliCommands } from './-components/CliCommands'

export const Route = createFileRoute('/docs/api/shortcuts/')({
  component: ShortcutsPage,
})

function ShortcutsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Shortcuts"
        description="Abbreviations for common operations to write more concise expressions."
      />

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Usage</h2>
        <Codeblock
          code={`echo '[1, 2, 3]' | 1ls '.mp(x => x * 2)'
# Output: [2, 4, 6]`}
          language="bash"
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Available Shortcuts</h2>
        <ShortcutsTable />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">CLI Commands</h2>
        <CliCommands />
      </section>
    </div>
  )
}
