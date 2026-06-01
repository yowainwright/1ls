import { SECTION, CONTAINER } from "@/lib/classes";
import type { DemoStep } from "./types";

const styles = {
  section: SECTION,
  container: CONTAINER,
  grid: "grid lg:grid-cols-2 gap-8 items-center",
  terminalHeader: "border-b border-white/10 bg-white/5 px-4 py-2",
  terminalHeaderText: "text-sm font-medium text-muted-foreground",
  terminalBody: "p-6 font-mono text-sm min-h-[200px]",
  terminalRow: "flex items-start gap-2",
  terminalPrompt: "text-[#50fa7b] shrink-0",
  terminalInput: "flex-1 relative",
  terminalText: "text-[#f8f8f2]",
  terminalCursor: "inline-block w-2 h-4 bg-[#f8f8f2] ml-0.5 align-middle",
  tooltip:
    "absolute top-full mt-2 bg-[#44475a] border border-white/10 rounded-md shadow-lg overflow-hidden z-10 min-w-[280px]",
  tooltipResult: "mt-4 pl-5",
  tooltipResultPre: "text-[#8be9fd] text-sm leading-relaxed",
  hintRow: "flex items-center gap-2 px-3 py-2 text-xs",
  hintRowSelected: "bg-[#6272a4]/50",
  hintChevron: "h-3 w-3 shrink-0",
  hintChevronSelected: "text-[#50fa7b]",
  hintChevronUnselected: "text-transparent",
  hintSignatureSelected: "text-[#f8f8f2] font-medium",
  hintSignatureUnselected: "text-[#f8f8f2]/70",
  hintDescription: "text-[#6272a4] ml-auto",
  hintBuiltinBadge: "text-[#ffb86c] text-[10px]",
  hintDataBadge: "text-[#8be9fd] text-[10px]",
  highlightMatch: "text-[#50fa7b]",
  featureDescription: "lg:py-4",
  featureTitle: "text-2xl font-semibold text-foreground mb-4",
  featureText: "text-lg text-muted-foreground leading-relaxed",
};

const text = {
  sectionTitle: "Smart Tooltips in Action",
  sectionDescription: "Watch how 1ls provides intelligent hints as you type",
  terminalHeaderLabel: "Interactive Mode",
  hintBuiltin: "[builtin]",
  hintData: "[data]",
};

export const FULL_QUERY = ".map(x => x.name).filter(x => x.startsWith('A'))";

export const DEMO_STEPS: DemoStep[] = [
  {
    triggerAt: 3,
    charEnd: 4,
    hints: [
      { signature: ".map(x => ...)", description: "Transform each item" },
      { signature: ".max()", description: "Maximum value", isBuiltin: true },
    ],
    selectedHint: 0,
    description: {
      title: "Fuzzy Method Matching",
      text: "Type partial names to find methods. Watch hints filter as you type more characters.",
    },
  },
  {
    triggerAt: 12,
    charEnd: 13,
    hints: [
      { signature: ".name", description: '"Alice"', isData: true },
      { signature: ".age", description: "28", isData: true },
    ],
    selectedHint: 0,
    description: {
      title: "Data-Aware Completions",
      text: "Inside expressions, hints show your actual data properties with live values.",
    },
  },
  {
    triggerAt: 18,
    charEnd: 22,
    hints: [
      { signature: ".filter(x => ...)", description: "Filter by condition" },
      { signature: ".find(x => ...)", description: "Find first match" },
      { signature: ".forEach(x => ...)", description: "Iterate each item" },
      { signature: ".flatMap(x => ...)", description: "Map and flatten" },
      { signature: ".join(sep)", description: "Join to string" },
      { signature: ".reduce((a,x) => ...)", description: "Reduce to value" },
      { signature: ".slice(start, end)", description: "Extract portion" },
      { signature: ".sort(fn)", description: "Sort items" },
    ],
    selectedHint: 0,
    description: {
      title: "Chain Methods",
      text: "After completing an expression, method hints appear to help you chain.",
    },
  },
  {
    triggerAt: 33,
    charEnd: 37,
    hints: [
      { signature: ".startsWith(str)", description: "Check string prefix" },
      { signature: ".status", description: '"active"', isData: true },
    ],
    selectedHint: 0,
    description: {
      title: "Mixed Completions",
      text: "Hints combine prototypes and data properties, matching whatever you type.",
    },
  },
  {
    triggerAt: FULL_QUERY.length,
    charEnd: FULL_QUERY.length,
    hints: [],
    selectedHint: -1,
    result: '["Alice"]',
    description: {
      title: "Instant Results",
      text: "Complete expressions evaluate immediately, showing output as you work.",
    },
  },
];

export const BASE_STEP_DURATION = 2000;

export const TOOLTIP_DEMO_CONSTANTS = { styles, text };
