import { SECTION, CONTAINER, CARD, CARD_OVERLAY } from "@/lib/classes";
import type { InsightStat } from "./types";

const styles = {
  section: SECTION,
  container: CONTAINER,
  grid: "grid gap-6 sm:grid-cols-2 lg:grid-cols-4",
  card: CARD,
  cardOverlay: CARD_OVERLAY,
  cardInner: "relative",
  value: "mb-2 text-4xl font-bold tracking-tight",
  label: "mb-1 text-sm font-semibold text-foreground",
  description: "text-sm text-muted-foreground",
};

const text = {
  sectionTitle: "Built for Speed",
  sectionDescription: "Optimized from the ground up to be lightweight and blazing fast",
};

const items: InsightStat[] = [
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
];

export const INSIGHTS_CONSTANTS = { styles, text, items };
