import { existsSync } from "node:fs";

const EXTENSIONS = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  "/index.ts",
  "/index.tsx",
  "/index.js",
  "/index.jsx",
];

const hasExtension = (specifier) => /\.[a-zA-Z0-9]+$/.test(specifier);

const isRelative = (specifier) => {
  if (specifier.startsWith("./")) return true;
  return specifier.startsWith("../");
};

const resolveExistingFile = (specifier, parentURL) => {
  for (const extension of EXTENSIONS) {
    const resolved = new URL(specifier + extension, parentURL);
    if (existsSync(resolved)) return resolved.href;
  }

  return null;
};

export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    const shouldResolve = isRelative(specifier) && !hasExtension(specifier);
    if (!shouldResolve) throw error;

    const resolved = resolveExistingFile(specifier, context.parentURL);
    if (resolved === null) throw error;
    return nextResolve(resolved, context);
  }
}
