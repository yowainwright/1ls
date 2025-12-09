import type { InsightStat } from "./types"

export const INSIGHT_STATS: InsightStat[] = [
  {
    label: "Zero Dependencies",
    value: "0",
    description: "No external runtime dependencies - just pure, efficient code",
  },
  {
    label: "Binary Size",
    value: "~1MB",
    description: "Compiled with Bun for minimal footprint",
  },
  {
    label: "Startup Time",
    value: "<50ms",
    description: "Near-instant execution for rapid workflows",
  },
  {
    label: "Formats Supported",
    value: "8+",
    description: "JSON, YAML, CSV, TOML, XML, INI, and more",
  },
]
