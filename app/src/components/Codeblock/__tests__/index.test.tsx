import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { render, waitFor } from "@testing-library/react";
import { Codeblock, getHighlighter } from "../index";

describe("Codeblock", () => {
  test("renders fallback with code while loading", () => {
    const { container } = render(<Codeblock code='{"test": true}' language="json" />);

    assert.ok(container.textContent.includes('{"test": true}'));
  });

  test("renders highlighted code after loading", async () => {
    await getHighlighter();
    const { container } = render(<Codeblock code='{"name": "test"}' language="json" />);

    await waitFor(() => {
      const content = container.querySelector(".shiki-content");
      assert.ok(content);
    });
    assert.ok(container.textContent.includes('"name"'));
  });

  test("applies custom className", () => {
    const { container } = render(
      <Codeblock code="test" language="json" className="custom-class" />,
    );

    assert.ok(container.firstChild instanceof Element && container.firstChild.classList.contains("custom-class"));
  });

  test("uses default language of json", () => {
    const { container } = render(<Codeblock code='{"a": 1}' />);

    assert.ok(container.textContent.includes('{"a": 1}'));
  });
});

describe("getHighlighter", () => {
  test("returns a highlighter instance", async () => {
    const highlighter = await getHighlighter();

    assert.notStrictEqual(highlighter, undefined);
    assert.strictEqual(typeof highlighter.codeToHtml, "function");
  });

  test("returns the same instance on subsequent calls", async () => {
    const first = await getHighlighter();
    const second = await getHighlighter();

    assert.strictEqual(first, second);
  });
});
