export interface FormatEntry {
  format: string
  description: string
  autoDetect: boolean
}

export const FORMATS: FormatEntry[] = [
  { format: 'JSON', description: 'Standard JSON', autoDetect: true },
  { format: 'JSON5', description: 'JSON with comments and trailing commas', autoDetect: true },
  { format: 'YAML', description: 'YAML documents', autoDetect: true },
  { format: 'TOML', description: 'TOML configuration files', autoDetect: true },
  { format: 'CSV', description: 'Comma-separated values', autoDetect: true },
  { format: 'TSV', description: 'Tab-separated values', autoDetect: true },
  { format: 'XML', description: 'XML documents', autoDetect: true },
  { format: 'INI', description: 'INI configuration files', autoDetect: true },
  { format: 'ENV', description: '.env files', autoDetect: true },
  { format: 'NDJSON', description: 'Newline-delimited JSON (logs)', autoDetect: true },
  { format: 'JavaScript', description: 'JS with export default', autoDetect: false },
  { format: 'TypeScript', description: 'TS with export default', autoDetect: false },
  { format: 'Text', description: 'Plain text, line by line', autoDetect: false },
]
