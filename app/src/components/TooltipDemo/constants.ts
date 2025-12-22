import type { DemoStep } from "./types"

// Full continuous query that builds up
export const FULL_QUERY = ".map(x => x.name).filter(x => x.startsWith('A'))"

export const DEMO_STEPS: DemoStep[] = [
  {
    triggerAt: 3,  // tooltip shows when we reach ".ma"
    charEnd: 4,    // step ends at ".map" - typing 'p' filters out .max()
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
    triggerAt: 12, // tooltip shows when we reach ".map(x => x."
    charEnd: 13,   // step ends at ".map(x => x.n" - typing 'n' filters out .age
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
    triggerAt: 18, // tooltip shows when we reach ".map(x => x.name)."
    charEnd: 22,   // step ends at ".map(x => x.name).filt" - typing 'filt' filters to just filter
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
    triggerAt: 33, // tooltip shows when we reach ".filter(x => x.s"
    charEnd: 37,   // step ends at ".filter(x => x.star" - typing 'star' filters out .status
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
]

export const BASE_STEP_DURATION = 2000
