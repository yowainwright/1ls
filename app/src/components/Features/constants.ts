import { SECTION, CONTAINER, CARD, CARD_OVERLAY } from "@/lib/classes";
import type { Feature } from "./types";

const styles = {
  section: SECTION,
  container: CONTAINER,
  grid: "grid gap-6 sm:grid-cols-2 lg:grid-cols-3",
  card: CARD,
  cardOverlay: CARD_OVERLAY,
  cardInner: "relative",
  iconWrap: "mb-4 inline-flex rounded-lg bg-primary/10 p-3",
  icon: "h-6 w-6 text-primary",
  title: "mb-2 text-lg font-semibold text-foreground",
  description: "text-sm text-muted-foreground",
};

const text = {
  sectionTitle: "Powerful Features",
  sectionDescription: "Everything you need for efficient data processing in your terminal",
};

const items: Feature[] = [
  {
    title: "JavaScript Syntax",
    description: "Use familiar array methods and syntax instead of learning jq's DSL",
    icon: "code",
  },
  {
    title: "Multi-format Support",
    description: "Works with JSON, YAML, CSV, TOML, XML, INI, and more",
    icon: "files",
  },
  {
    title: "Fast & Lightweight",
    description: "Zero dependencies, built with Bun for maximum speed",
    icon: "zap",
  },
  {
    title: "Smart Tooltips",
    description: "Get method hints as you type with live result previews",
    icon: "sparkles",
  },
  {
    title: "Shortcuts",
    description: "Built-in shortcuts for common operations (e.g., .mp for .map)",
    icon: "command",
  },
  {
    title: "File Operations",
    description: "Read, list, and grep files with native support",
    icon: "folder",
  },
];

export const FEATURES_CONSTANTS = { styles, text, items };
