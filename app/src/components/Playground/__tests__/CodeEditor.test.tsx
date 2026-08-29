import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { render } from "@testing-library/react";

import { CodeEditor } from "../CodeEditor";

describe("CodeEditor", () => {
  test("renders label", () => {
    const { container } = render(
      <CodeEditor label="Input" value="" onValueChange={() => {}} language="json" />,
    );
    assert.ok(container.textContent.includes("Input"));
  });

  test("renders editor textarea", () => {
    const { container } = render(
      <CodeEditor label="Input" value="test code" onValueChange={() => {}} language="json" />,
    );
    assert.ok(container.querySelector("textarea"));
  });

  test("shows copy button when showCopy=true", () => {
    const { container } = render(
      <CodeEditor
        label="Expression"
        value="some code"
        onValueChange={() => {}}
        language="javascript"
        showCopy
      />,
    );
    assert.ok(container.querySelector("[aria-label='Copy code']"));
  });

  test("hides copy button when showCopy is not set", () => {
    const { container } = render(
      <CodeEditor
        label="Expression"
        value="some code"
        onValueChange={() => {}}
        language="javascript"
      />,
    );
    assert.strictEqual(container.querySelector("[aria-label='Copy code']"), null);
  });

  test("renders footer content", () => {
    const { container } = render(
      <CodeEditor
        label="Expression"
        value=""
        onValueChange={() => {}}
        language="javascript"
        footer={<button>Minify</button>}
      />,
    );
    assert.ok(container.textContent.includes("Minify"));
  });

  test("does not render footer wrapper when footer is not provided", () => {
    const { container } = render(
      <CodeEditor label="Input" value="" onValueChange={() => {}} language="json" />,
    );
    assert.ok(!container.textContent.includes("Minify"));
  });

  test("applies className to wrapper", () => {
    const { container } = render(
      <CodeEditor
        label="Test"
        value=""
        onValueChange={() => {}}
        language="json"
        className="my-custom-class"
      />,
    );
    assert.ok(container.querySelector(".my-custom-class"));
  });

  test("passes placeholder to editor", () => {
    const { container } = render(
      <CodeEditor
        label="Input"
        value=""
        onValueChange={() => {}}
        language="json"
        placeholder="Paste your data here..."
      />,
    );
    const textarea = container.querySelector("textarea");
    assert.strictEqual(textarea?.placeholder, "Paste your data here...");
  });

  test("renders with value immediately (singleton highlighter actor)", () => {
    const { container } = render(
      <CodeEditor label="Input" value='{"a": 1}' onValueChange={() => {}} language="json" />,
    );
    assert.ok(container.querySelector("textarea"));
    assert.ok(container.textContent.includes("Input"));
  });
});
