import { createFileRoute } from '@tanstack/react-router'
import { PageHeader } from '../-components/PageHeader'
import { Codeblock } from '@/components/Codeblock'

export const Route = createFileRoute('/docs/guides/installation')({
  component: InstallationGuide,
})

function InstallationGuide() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Installation"
        description="Get 1ls up and running in your environment."
      />

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Using npm/bun/pnpm</h2>
        <p className="text-muted-foreground">
          Install 1ls globally to use it from the command line or in the browser.
        </p>
        <Codeblock code="bun add -g 1ls" language="bash" />
        <p className="text-sm text-muted-foreground">
          Works with npm, pnpm, or yarn too.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Using Homebrew</h2>
        <p className="text-muted-foreground">
          On macOS or Linux, you can install via Homebrew for a native binary.
        </p>
        <Codeblock code="brew install yowainwright/tap/1ls" language="bash" />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Using curl</h2>
        <p className="text-muted-foreground">
          Install directly with a single command.
        </p>
        <Codeblock
          code="curl -fsSL https://raw.githubusercontent.com/yowainwright/1ls/main/install.sh | bash"
          language="bash"
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Verify Installation</h2>
        <p className="text-muted-foreground">
          Check that 1ls is installed correctly.
        </p>
        <Codeblock code="1ls --version" language="bash" />
      </section>
    </div>
  )
}
