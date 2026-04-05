import { test, expect, beforeEach, afterEach } from "bun:test";
import { spawn } from "bun";
import { mkdtemp, rm, mkdir, writeFile, readdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

const SCRIPT = join(import.meta.dir, "../../scripts/install-skills.sh");

async function run(
  env: Record<string, string>,
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const proc = spawn(["bash", SCRIPT], {
    env: { ...process.env, ...env },
    stdout: "pipe",
    stderr: "pipe",
  });
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  await proc.exited;
  return { exitCode: proc.exitCode ?? 1, stdout, stderr };
}

async function makeSkillsFixture(dir: string): Promise<void> {
  const skillA = join(dir, "add-builtin");
  const skillB = join(dir, "qjs-compat");
  await mkdir(skillA, { recursive: true });
  await mkdir(skillB, { recursive: true });
  await writeFile(join(skillA, "SKILL.md"), "# Add Builtin");
  await writeFile(join(skillB, "SKILL.md"), "# QJS Compat");
  await writeFile(join(dir, "agents.md"), "# Agents");
}

let tmp = "";

beforeEach(async () => {
  tmp = await mkdtemp(join(tmpdir(), "1ls-install-skills-"));
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

  expect(result.exitCode).toBe(0);
  const entries = await readdir(join(installDir, "skills"));
  expect(entries).toContain("add-builtin");
  expect(entries).toContain("qjs-compat");
  expect(entries).toContain("agents.md");
});

test("creates INSTALL_DIR/skills if it does not exist", async () => {
  const src = join(tmp, "skills");
  const installDir = join(tmp, "nonexistent", ".claude");
  const codexDest = join(tmp, ".codex", "AGENTS.md");
  await makeSkillsFixture(src);

  const result = await run({ SKILLS_SRC: src, INSTALL_DIR: installDir, CODEX_DEST: codexDest });

  expect(result.exitCode).toBe(0);
  const entries = await readdir(join(installDir, "skills"));
  expect(entries.length).toBeGreaterThan(0);
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

  expect(result.exitCode).toBe(0);
  const entries = await readdir(join(installDir, "skills", "add-builtin"));
  expect(entries).toContain("SKILL.md");
  expect(entries).toContain("good-example.ts");
});

test("is idempotent — second run does not fail", async () => {
  const src = join(tmp, "skills");
  const installDir = join(tmp, ".claude");
  const codexDest = join(tmp, ".codex", "AGENTS.md");
  await makeSkillsFixture(src);

  const env = { SKILLS_SRC: src, INSTALL_DIR: installDir, CODEX_DEST: codexDest };
  const first = await run(env);
  const second = await run(env);

  expect(first.exitCode).toBe(0);
  expect(second.exitCode).toBe(0);
});

test("exits non-zero when SKILLS_SRC does not exist", async () => {
  const result = await run({
    SKILLS_SRC: join(tmp, "nonexistent"),
    INSTALL_DIR: join(tmp, ".claude"),
    CODEX_DEST: join(tmp, ".codex", "AGENTS.md"),
  });

  expect(result.exitCode).not.toBe(0);
  expect(result.stderr).toContain("Error");
});

test("prints confirmation message on success", async () => {
  const src = join(tmp, "skills");
  const installDir = join(tmp, ".claude");
  const codexDest = join(tmp, ".codex", "AGENTS.md");
  await makeSkillsFixture(src);

  const result = await run({ SKILLS_SRC: src, INSTALL_DIR: installDir, CODEX_DEST: codexDest });

  expect(result.stdout).toContain("✓ Skills installed to");
  expect(result.stdout).toContain(join(installDir, "skills"));
});

test("copies agents.md into .codex/AGENTS.md", async () => {
  const src = join(tmp, "skills");
  const codexDest = join(tmp, ".codex", "AGENTS.md");
  await makeSkillsFixture(src);

  const result = await run({ SKILLS_SRC: src, INSTALL_DIR: join(tmp, ".claude"), CODEX_DEST: codexDest });

  expect(result.exitCode).toBe(0);
  const content = await Bun.file(codexDest).text();
  expect(content).toBe("# Agents");
});

test("creates .codex/ dir if it does not exist", async () => {
  const src = join(tmp, "skills");
  const codexDest = join(tmp, "nonexistent", ".codex", "AGENTS.md");
  await makeSkillsFixture(src);

  const result = await run({ SKILLS_SRC: src, INSTALL_DIR: join(tmp, ".claude"), CODEX_DEST: codexDest });

  expect(result.exitCode).toBe(0);
  expect(await Bun.file(codexDest).exists()).toBe(true);
});

test("prints confirmation for codex install", async () => {
  const src = join(tmp, "skills");
  const codexDest = join(tmp, ".codex", "AGENTS.md");
  await makeSkillsFixture(src);

  const result = await run({ SKILLS_SRC: src, INSTALL_DIR: join(tmp, ".claude"), CODEX_DEST: codexDest });

  expect(result.stdout).toContain("✓ AGENTS.md installed to");
  expect(result.stdout).toContain(codexDest);
});

test("codex install is idempotent", async () => {
  const src = join(tmp, "skills");
  const codexDest = join(tmp, ".codex", "AGENTS.md");
  await makeSkillsFixture(src);

  const env = { SKILLS_SRC: src, INSTALL_DIR: join(tmp, ".claude"), CODEX_DEST: codexDest };
  const first = await run(env);
  const second = await run(env);

  expect(first.exitCode).toBe(0);
  expect(second.exitCode).toBe(0);
});
