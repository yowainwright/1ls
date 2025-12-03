import { createFileRoute } from '@tanstack/react-router'
import { PageHeader } from '../../-components/PageHeader'
import { Codeblock } from '@/components/Codeblock'
import { FormatsTable } from './-components/FormatsTable'

export const Route = createFileRoute('/docs/api/formats/')({
  component: FormatsPage,
})

function FormatsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Multi-format Support"
        description="1ls automatically detects and parses many data formats."
      />

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Supported Formats</h2>
        <FormatsTable />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Examples</h2>

        <div className="space-y-4">
          <div>
            <h3 className="font-medium">YAML</h3>
            <Codeblock
              code={`echo 'name: John
age: 30
city: NYC' | 1ls '.name'
# Output: "John"`}
              language="bash"
            />
          </div>

          <div>
            <h3 className="font-medium">CSV</h3>
            <Codeblock
              code={`echo 'name,age
John,30
Jane,25' | 1ls '.map(x => x.name)'
# Output: ["John", "Jane"]`}
              language="bash"
            />
          </div>

          <div>
            <h3 className="font-medium">ENV</h3>
            <Codeblock
              code={`echo 'DATABASE_URL=postgres://localhost/db
PORT=3000' | 1ls '.PORT'
# Output: 3000`}
              language="bash"
            />
          </div>

          <div>
            <h3 className="font-medium">NDJSON (logs)</h3>
            <Codeblock
              code={`echo '{"level":"error","msg":"Failed"}
{"level":"info","msg":"Started"}' | 1ls '.filter(x => x.level === "error")'
# Output: [{"level":"error","msg":"Failed"}]`}
              language="bash"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Explicit Format</h2>
        <p className="text-muted-foreground">
          Use <code className="font-mono text-primary">--input-format</code> to specify the format explicitly.
        </p>
        <Codeblock
          code={`cat data.yaml | 1ls --input-format yaml '.users[0].name'
cat data.csv | 1ls --input-format csv '.filter(x => x.age > 25)'`}
          language="bash"
        />
      </section>
    </div>
  )
}
