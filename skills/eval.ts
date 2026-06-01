/**
 * Skill evaluation script.
 *
 * Checks:
 * 1. Directory structure — each skill has SKILL.md, good-example.ts, bad-example.ts
 * 2. SKILL.md frontmatter — has description field
 * 3. SKILL.md content — has required sections (Files to Touch, Constraints, See Examples, Links, Run)
 * 4. Example compilation — all .ts files pass tsc --noEmit
 * 5. Link validity — relative source links point to existing files
 * 6. agents.md exists and has required sections
 *
 * Usage: bun skills/eval.ts
 */

import { readdirSync, readFileSync, existsSync, statSync } from "fs";
import { join, resolve } from "path";
import { spawnSync } from "child_process";

const ROOT = resolve(import.meta.dir, "..");
const SKILLS_DIR = join(ROOT, "skills");

const SKILL_DIRS = ["add-builtin", "add-format", "add-test", "add-method", "qjs-compat"];
const REQUIRED_FILES = ["SKILL.md", "good-example.ts", "bad-example.ts"];
const REQUIRED_SECTIONS = ["## Files to Touch", "## Constraints", "## See Examples", "## Links", "## Run"];
const AGENTS_SECTIONS = ["## Code Style", "## Testing", "## Benchmarking", "## Project Intent"];

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
    passed++;
  } else {
    console.log(`  \x1b[31m✗\x1b[0m ${name}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

// 1. Directory structure
console.log("\n\x1b[1m1. Directory Structure\x1b[0m\n");
for (const dir of SKILL_DIRS) {
  const dirPath = join(SKILLS_DIR, dir);
  check(`${dir}/ exists`, existsSync(dirPath) && statSync(dirPath).isDirectory());
  for (const file of REQUIRED_FILES) {
    const filePath = join(dirPath, file);
    check(`${dir}/${file} exists`, existsSync(filePath));
  }
}

// 2. SKILL.md frontmatter
console.log("\n\x1b[1m2. SKILL.md Frontmatter\x1b[0m\n");
for (const dir of SKILL_DIRS) {
  const skillPath = join(SKILLS_DIR, dir, "SKILL.md");
  if (!existsSync(skillPath)) continue;
  const content = readFileSync(skillPath, "utf-8");
  const hasFrontmatter = content.startsWith("---");
  check(`${dir}/SKILL.md has frontmatter`, hasFrontmatter);
  const hasDescription = /^description:\s*.+$/m.test(content);
  check(`${dir}/SKILL.md has description`, hasDescription);
}

// 3. SKILL.md required sections
console.log("\n\x1b[1m3. SKILL.md Required Sections\x1b[0m\n");
for (const dir of SKILL_DIRS) {
  const skillPath = join(SKILLS_DIR, dir, "SKILL.md");
  if (!existsSync(skillPath)) continue;
  const content = readFileSync(skillPath, "utf-8");
  for (const section of REQUIRED_SECTIONS) {
    check(`${dir}/SKILL.md has "${section}"`, content.includes(section));
  }
}

// 4. Example compilation
console.log("\n\x1b[1m4. Example Compilation (tsc --noEmit)\x1b[0m\n");
const tsFiles: string[] = [];
for (const dir of SKILL_DIRS) {
  for (const file of ["good-example.ts", "bad-example.ts"]) {
    const filePath = join(SKILLS_DIR, dir, file);
    if (existsSync(filePath)) tsFiles.push(filePath);
  }
}

const bunPath = process.argv[0] || "bun";
const tscResult = spawnSync(bunPath, [
  "tsc", "--noEmit", "--strict", "--target", "esnext",
  "--module", "esnext", "--moduleResolution", "bundler",
  "--types", "bun", "--skipLibCheck",
  ...tsFiles,
], { cwd: ROOT, encoding: "utf-8" });

if (tscResult.status === 0) {
  check(`All ${tsFiles.length} example files compile`, true);
} else {
  check(`All ${tsFiles.length} example files compile`, false, tscResult.stderr || tscResult.stdout);
  // Show per-file errors
  const output = (tscResult.stderr || tscResult.stdout || "").trim();
  if (output) {
    for (const line of output.split("\n").slice(0, 10)) {
      console.log(`    ${line}`);
    }
  }
}

// 5. Relative link validity
console.log("\n\x1b[1m5. Relative Link Validity\x1b[0m\n");
const RELATIVE_LINK = /\[.*?\]\((\.\.?\/[^)]+)\)/g;
for (const dir of SKILL_DIRS) {
  const skillPath = join(SKILLS_DIR, dir, "SKILL.md");
  if (!existsSync(skillPath)) continue;
  const content = readFileSync(skillPath, "utf-8");
  let match: RegExpExecArray | null;
  while ((match = RELATIVE_LINK.exec(content)) !== null) {
    const linkTarget = match[1];
    const resolved = resolve(join(SKILLS_DIR, dir), linkTarget);
    check(`${dir}: link ${linkTarget}`, existsSync(resolved), `→ ${resolved}`);
  }
}

// Also check agents.md links
const agentsPath = join(SKILLS_DIR, "agents.md");
if (existsSync(agentsPath)) {
  const content = readFileSync(agentsPath, "utf-8");
  let match: RegExpExecArray | null;
  const agentsLinkRe = /\[.*?\]\((\.\.?\/[^)]+)\)/g;
  while ((match = agentsLinkRe.exec(content)) !== null) {
    const linkTarget = match[1];
    const resolved = resolve(SKILLS_DIR, linkTarget);
    check(`agents.md: link ${linkTarget}`, existsSync(resolved), `→ ${resolved}`);
  }
}

// 6. agents.md
console.log("\n\x1b[1m6. agents.md\x1b[0m\n");
check("agents.md exists", existsSync(agentsPath));
if (existsSync(agentsPath)) {
  const content = readFileSync(agentsPath, "utf-8");
  for (const section of AGENTS_SECTIONS) {
    check(`agents.md has "${section}"`, content.includes(section));
  }
}

// Summary
console.log(`\n\x1b[1mResults: ${passed} passed, ${failed} failed\x1b[0m\n`);
process.exit(failed > 0 ? 1 : 0);
