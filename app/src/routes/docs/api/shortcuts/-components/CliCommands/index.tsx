import { Codeblock } from '@/components/Codeblock'
import { CLI_COMMANDS } from './constants'

export function CliCommands() {
  return (
    <div className="space-y-3">
      {CLI_COMMANDS.map((cmd) => (
        <div key={cmd.title}>
          <h3 className="font-medium">{cmd.title}</h3>
          <Codeblock code={cmd.code} language="bash" />
        </div>
      ))}
    </div>
  )
}
