import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
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

describe("tooltip/renderer selection", () => {
  test("selectNext wraps using the suggestion count", () => {
    resetSelection();

    selectNext(2);
    expect(getSelectedIndex()).toBe(1);

    selectNext(2);
    expect(getSelectedIndex()).toBe(0);
  });

  test("selectPrev wraps using the suggestion count", () => {
    resetSelection();

    selectPrev(2);

    expect(getSelectedIndex()).toBe(1);
  });

  test("selection ignores empty suggestion counts", () => {
    resetSelection();

    selectNext(0);
    selectPrev(0);

    expect(getSelectedIndex()).toBe(0);
  });

  test("render sizes borders from visible text length", () => {
    const dir = mkdtempSync(join(tmpdir(), "1ls-tooltip-renderer-"));
    const ttyPath = join(dir, "tty");

    try {
      expect(openTty(ttyPath)).toBe(true);

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

      expect(output).toContain(
        `${BORDER.TL}${BORDER.H.repeat(expectedInnerWidth)}${BORDER.TR}`
      );
      expect(output).not.toContain(
        `${BORDER.TL}${BORDER.H.repeat(expectedInnerWidth + 10)}`
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
