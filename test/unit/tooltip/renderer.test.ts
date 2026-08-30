import { afterEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "fs";
import { join } from "path";
import { BORDER } from "../../../src/tooltip/constants";
import {
  closeTty,
  getSelectedIndex,
  openTty,
  render,
  resetSelection,
  selectNext,
  selectPrev,
} from "../../../src/tooltip/renderer";

afterEach(() => {
  closeTty();
});

const TEST_ROOT = join(process.cwd(), ".cache", "tests");

const createTestDir = (): string => {
  mkdirSync(TEST_ROOT, { recursive: true });
  return mkdtempSync(join(TEST_ROOT, "1ls-tooltip-renderer-"));
};

describe("tooltip/renderer selection", () => {
  test("selectNext wraps using the suggestion count", () => {
    resetSelection();

    selectNext(2);
    assert.strictEqual(getSelectedIndex(), 1);

    selectNext(2);
    assert.strictEqual(getSelectedIndex(), 0);
  });

  test("selectPrev wraps using the suggestion count", () => {
    resetSelection();

    selectPrev(2);

    assert.strictEqual(getSelectedIndex(), 1);
  });

  test("selection ignores empty suggestion counts", () => {
    resetSelection();

    selectNext(0);
    selectPrev(0);

    assert.strictEqual(getSelectedIndex(), 0);
  });

  test("render sizes borders from visible text length", () => {
    const dir = createTestDir();
    const ttyPath = join(dir, "tty");

    try {
      assert.strictEqual(openTty(ttyPath), true);

      render([
        {
          signature: "name",
          type: "path",
          description: "desc",
        },
      ]);
      closeTty();

      const output = readFileSync(ttyPath, "utf8");
      const expectedInnerWidth = 20;

      assert.ok(output.includes(`${BORDER.TL}${BORDER.H.repeat(expectedInnerWidth)}${BORDER.TR}`));
      assert.ok(!output.includes(`${BORDER.TL}${BORDER.H.repeat(expectedInnerWidth + 10)}`));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("openTty reuses an active descriptor", () => {
    const dir = createTestDir();
    const firstTtyPath = join(dir, "first-tty");
    const secondTtyPath = join(dir, "second-tty");

    try {
      assert.strictEqual(openTty(firstTtyPath), true);
      render([
        {
          signature: "first",
          type: "path",
          description: "desc",
        },
      ]);

      assert.strictEqual(openTty(secondTtyPath), true);
      render([
        {
          signature: "second",
          type: "path",
          description: "desc",
        },
      ]);
      closeTty();

      const output = readFileSync(firstTtyPath, "utf8");

      assert.ok(output.includes("first"));
      assert.ok(output.includes("second"));
      assert.strictEqual(existsSync(secondTtyPath), false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
