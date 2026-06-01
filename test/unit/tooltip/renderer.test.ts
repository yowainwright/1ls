import { describe, expect, test } from "bun:test";
import { getSelectedIndex, resetSelection, selectNext, selectPrev } from "../../../src/tooltip/renderer";

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
});
