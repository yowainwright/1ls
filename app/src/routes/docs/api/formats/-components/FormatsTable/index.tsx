import { FORMATS } from '../../-constants'

export function FormatsTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/10">
            <th className="py-2 pr-4 text-left font-medium">Format</th>
            <th className="py-2 pr-4 text-left font-medium">Description</th>
            <th className="py-2 text-left font-medium">Auto-detect</th>
          </tr>
        </thead>
        <tbody className="text-muted-foreground">
          {FORMATS.map((f, i) => (
            <tr
              key={f.format}
              className={i < FORMATS.length - 1 ? 'border-b border-border/10' : ''}
            >
              <td className="py-2 pr-4 font-mono text-primary">{f.format}</td>
              <td className="py-2 pr-4">{f.description}</td>
              <td className="py-2">{f.autoDetect ? '✓' : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
