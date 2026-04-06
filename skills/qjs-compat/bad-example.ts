/**
 * BAD: QuickJS NG incompatible patterns.
 *
 * Each block uses APIs that will crash or silently fail in QuickJS NG.
 * Compare with: good-example.ts
 */

// BAD: async/await — QuickJS CLI has no event loop
// Fix: keep all functions synchronous
async function fetchAndParse(url: string): Promise<unknown> {
  const resp = await fetch(url);
  return resp.json();
}

// BAD: Intl — QuickJS has no ICU support
// Fix: use manual locale-free string comparison
function sortByLocale(data: string[]): string[] {
  return [...data].sort(new Intl.Collator("en").compare);
}

// BAD: structuredClone — not available in QuickJS
// Fix: use { ...obj } for shallow or JSON.parse(JSON.stringify(obj)) for deep
function cloneDeep(obj: unknown): unknown {
  return structuredClone(obj);
}

// BAD: TextEncoder/TextDecoder — not available in QuickJS
// Fix: work with strings directly, avoid byte-level operations
function getByteLength(str: string): number {
  return new TextEncoder().encode(str).length;
}

function decodeBytes(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

// BAD: URL/URLSearchParams — not available in QuickJS
// Fix: use string.split() or regex for URL/query parsing
function parseURL(input: string): Record<string, string> {
  const url = new URL(input);
  const params: Record<string, string> = {};
  url.searchParams.forEach((v, k) => { params[k] = v; });
  return params;
}

// BAD: Regex lookbehind — not supported in all QuickJS builds
// Fix: use capturing groups like /([a-z])([A-Z])/g with "$1 $2"
function splitCamelCase(str: string): string[] {
  return str.split(/(?<=[a-z])(?=[A-Z])/);
}

// BAD: WeakRef — not available in QuickJS
// Fix: use regular references, manage lifecycle manually
function createWeakCache(): Map<string, WeakRef<object>> {
  return new Map();
}

// BAD: setTimeout — no event loop in QuickJS CLI
// Fix: N/A — if you need delays, the design is wrong for a CLI tool
function debounce(fn: () => void, ms: number): () => void {
  let timer: ReturnType<typeof setTimeout>;
  return () => {
    clearTimeout(timer);
    timer = setTimeout(fn, ms);
  };
}

// BAD: Bun-specific API — not available in QuickJS
// Fix: don't use runtime-specific APIs in bundled code
// Uncomment to see the pattern:
// function readFile(path: string): string {
//   return Bun.file(path).text();
// }

// BAD: Dynamic import() — not available in QuickJS CLI context
// Fix: use static imports only in QJS code
// async function loadModule(name: string): Promise<unknown> {
//   return import(name);
// }

// BAD: Mutates input — sort() modifies the original array in place
// Fix: [...data].sort() to create a copy first
function sortInPlace(data: number[]): number[] {
  data.sort((a, b) => a - b);
  return data;
}

// BAD: console.log in library code — QuickJS uses print() for stdout
// Fix: for debug output use console.error (maps to std.err in QJS)
function processWithLogging(data: unknown[]): unknown[] {
  console.log("Processing", data.length, "items");
  return data.map((item) => {
    console.log("Item:", item);
    return item;
  });
}

export {
  fetchAndParse,
  sortByLocale,
  cloneDeep,
  getByteLength,
  decodeBytes,
  parseURL,
  splitCamelCase,
  createWeakCache,
  debounce,
  sortInPlace,
  processWithLogging,
};
