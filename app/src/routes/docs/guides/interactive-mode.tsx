import { createFileRoute } from '@tanstack/react-router'
import { PageHeader } from '../-components/PageHeader'
import { Codeblock } from '@/components/Codeblock'
import { KeyboardShortcuts } from './-components/KeyboardShortcuts'
import { MethodsByType } from './-components/MethodsByType'
import { ExpressionBuilderSteps } from './-components/ExpressionBuilderSteps'

export const Route = createFileRoute('/docs/guides/interactive-mode')({
  component: InteractiveModeGuide,
})

function InteractiveModeGuide() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Interactive Mode"
        description="Explore JSON interactively with fuzzy search and expression building."
      />

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Opening Interactive Mode</h2>
        <p className="text-muted-foreground">
          Open a file without an expression to enter interactive mode.
        </p>
        <Codeblock code="1ls readFile data.json" language="bash" />
        <p className="text-muted-foreground">Works with all supported formats.</p>
        <Codeblock
          code={`1ls readFile config.yaml
1ls readFile config.toml`}
          language="bash"
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Mode 1: Path Explorer</h2>
        <p className="text-muted-foreground">Navigate and search JSON paths.</p>
        <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
          <li>
            <strong>Fuzzy search:</strong> Type to filter paths
          </li>
          <li>
            <strong>Live preview:</strong> See values as you navigate
          </li>
          <li>
            <strong>Type information:</strong> Shows String, Number, Array,
            Object, Boolean, or null
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Mode 2: Expression Builder</h2>
        <p className="text-muted-foreground">
          Build complex expressions with guided method selection.
        </p>
        <ExpressionBuilderSteps />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Example Session</h2>
        <Codeblock
          code={`1. Navigate to .users (Array) → Tab
2. Type "fil" → → (accepts .filter(x => ...))
3. Type "act" → → (completes with x.active)
4. Type "map" → → (accepts .map(x => ...))
5. Type "name" → → (completes with x.name)
6. Enter → executes: .users.filter(x => x.active).map(x => x.name)`}
          language="bash"
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Keyboard Shortcuts</h2>
        <KeyboardShortcuts />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Available Methods by Type</h2>
        <MethodsByType />
      </section>
    </div>
  )
}
