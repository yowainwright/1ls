import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, rm, mkdir, writeFile, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { text } from "node:stream/consumers";

const SCRIPT = join(import.meta.dirname, "../../scripts/install-skills.sh");
const TEST_ROOT = join(import.meta.dirname, "../../tmp/install-skills");

async function run(
  env: Record<string, string>,
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const proc = spawn("bash", [SCRIPT], {
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const stdout = await text(proc.stdout);
  const stderr = await text(proc.stderr);
  const exitCode = await new Promise<number>((resolve) => {
    proc.on("close", (code) => resolve(code ?? 1));
  });
  return { exitCode, stdout, stderr };
}

async function makeSkillsFixture(dir: string): Promise<void> {
  const skillA = join(dir, "add-builtin");
  const skillB = join(dir, "add-format");
  await mkdir(skillA, { recursive: true });
  await mkdir(skillB, { recursive: true });
  await writeFile(join(skillA, "SKILL.md"), "# Add Builtin");
  await writeFile(join(skillB, "SKILL.md"), "# Add Format");
  await writeFile(join(dir, "agents.md"), "# Agents");
}

let tmp = "";

beforeEach(async () => {
  await mkdir(TEST_ROOT, { recursive: true });
  tmp = await mkdtemp(join(TEST_ROOT, "case-"));
});

afterEach(async () => {
  await rm(tmp, { recursive: true, force: true });
});

test("copies skill dirs and agents.md into INSTALL_DIR/skills", async () => {
  const src = join(tmp, "skills");
  const installDir = join(tmp, ".claude");
  const codexDest = join(tmp, ".codex", "AGENTS.md");
  await makeSkillsFixture(src);

  const result = await run({ SKILLS_SRC: src, INSTALL_DIR: installDir, CODEX_DEST: codexDest });

  assert.strictEqual(result.exitCode, 0);
  const entries = await readdir(join(installDir, "skills"));
  assert.ok(entries.includes("add-builtin"));
  assert.ok(entries.includes("add-format"));
  assert.ok(entries.includes("agents.md"));
});

test("creates INSTALL_DIR/skills if it does not exist", async () => {
  const src = join(tmp, "skills");
  const installDir = join(tmp, "nonexistent", ".claude");
  const codexDest = join(tmp, ".codex", "AGENTS.md");
  await makeSkillsFixture(src);

  const result = await run({ SKILLS_SRC: src, INSTALL_DIR: installDir, CODEX_DEST: codexDest });

  assert.strictEqual(result.exitCode, 0);
  const entries = await readdir(join(installDir, "skills"));
  assert.ok(entries.length > 0);
});

test("copies nested files inside skill dirs", async () => {
  const src = join(tmp, "skills");
  const installDir = join(tmp, ".claude");
  const codexDest = join(tmp, ".codex", "AGENTS.md");
  await mkdir(join(src, "add-builtin"), { recursive: true });
  await writeFile(join(src, "add-builtin", "SKILL.md"), "# skill");
  await writeFile(join(src, "add-builtin", "good-example.ts"), "export {}");
  await writeFile(join(src, "agents.md"), "# Agents");

  const result = await run({ SKILLS_SRC: src, INSTALL_DIR: installDir, CODEX_DEST: codexDest });

  assert.strictEqual(result.exitCode, 0);
  const entries = await readdir(join(installDir, "skills", "add-builtin"));
  assert.ok(entries.includes("SKILL.md"));
  assert.ok(entries.includes("good-example.ts"));
});

test("is idempotent — second run does not fail", async () => {
  const src = join(tmp, "skills");
  const installDir = join(tmp, ".claude");
  const codexDest = join(tmp, ".codex", "AGENTS.md");
  await makeSkillsFixture(src);

  const env = { SKILLS_SRC: src, INSTALL_DIR: installDir, CODEX_DEST: codexDest };
  const first = await run(env);
  const second = await run(env);

  assert.strictEqual(first.exitCode, 0);
  assert.strictEqual(second.exitCode, 0);
});

test("exits non-zero when SKILLS_SRC does not exist", async () => {
  const result = await run({
    SKILLS_SRC: join(tmp, "nonexistent"),
    INSTALL_DIR: join(tmp, ".claude"),
    CODEX_DEST: join(tmp, ".codex", "AGENTS.md"),
  });

  assert.notStrictEqual(result.exitCode, 0);
  assert.ok(result.stderr.includes("Error"));
});

test("prints confirmation message on success", async () => {
  const src = join(tmp, "skills");
  const installDir = join(tmp, ".claude");
  const codexDest = join(tmp, ".codex", "AGENTS.md");
  await makeSkillsFixture(src);

  const result = await run({ SKILLS_SRC: src, INSTALL_DIR: installDir, CODEX_DEST: codexDest });

  assert.ok(result.stdout.includes("✓ Skills installed to"));
  assert.ok(result.stdout.includes(join(installDir, "skills")));
});

test("copies agents.md into .codex/AGENTS.md", async () => {
  const src = join(tmp, "skills");
  const codexDest = join(tmp, ".codex", "AGENTS.md");
  await makeSkillsFixture(src);

  const result = await run({ SKILLS_SRC: src, INSTALL_DIR: join(tmp, ".claude"), CODEX_DEST: codexDest });

  assert.strictEqual(result.exitCode, 0);
  const content = await readFile(codexDest, "utf8");
  assert.strictEqual(content, "# Agents");
});

test("creates .codex/ dir if it does not exist", async () => {
  const src = join(tmp, "skills");
  const codexDest = join(tmp, "nonexistent", ".codex", "AGENTS.md");
  await makeSkillsFixture(src);

  const result = await run({ SKILLS_SRC: src, INSTALL_DIR: join(tmp, ".claude"), CODEX_DEST: codexDest });

  assert.strictEqual(result.exitCode, 0);
  assert.strictEqual(existsSync(codexDest), true);
});

test("prints confirmation for codex install", async () => {
  const src = join(tmp, "skills");
  const codexDest = join(tmp, ".codex", "AGENTS.md");
  await makeSkillsFixture(src);

  const result = await run({ SKILLS_SRC: src, INSTALL_DIR: join(tmp, ".claude"), CODEX_DEST: codexDest });

  assert.ok(result.stdout.includes("✓ AGENTS.md installed to"));
  assert.ok(result.stdout.includes(codexDest));
});

test("codex install is idempotent", async () => {
  const src = join(tmp, "skills");
  const codexDest = join(tmp, ".codex", "AGENTS.md");
  await makeSkillsFixture(src);

  const env = { SKILLS_SRC: src, INSTALL_DIR: join(tmp, ".claude"), CODEX_DEST: codexDest };
  const first = await run(env);
  const second = await run(env);

  assert.strictEqual(first.exitCode, 0);
  assert.strictEqual(second.exitCode, 0);
});
