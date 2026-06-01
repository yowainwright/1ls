import { describe, test, expect, mock } from "bun:test";
import { render } from "@testing-library/react";

mock.module("react-simple-code-editor", () => ({
  default: ({
    value,
    onValueChange,
    placeholder,
  }: {
    value: string;
    onValueChange: (v: string) => void;
    placeholder?: string;
  }) => (
    <textarea
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      placeholder={placeholder}
    />
  ),
}));

import { CodeEditor } from "../CodeEditor";

describe("CodeEditor", () => {
  test("renders label", () => {
    const { container } = render(
      <CodeEditor label="Input" value="" onValueChange={() => {}} language="json" />,
    );
    expect(container.textContent).toContain("Input");
  });

  test("renders editor textarea", () => {
    const { container } = render(
      <CodeEditor label="Input" value="test code" onValueChange={() => {}} language="json" />,
    );
    expect(container.querySelector("textarea")).toBeInTheDocument();
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
    expect(container.querySelector("[aria-label='Copy code']")).toBeInTheDocument();
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
    expect(container.querySelector("[aria-label='Copy code']")).not.toBeInTheDocument();
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
    expect(container.textContent).toContain("Minify");
  });

  test("does not render footer wrapper when footer is not provided", () => {
    const { container } = render(
      <CodeEditor label="Input" value="" onValueChange={() => {}} language="json" />,
    );
    expect(container.textContent).not.toContain("Minify");
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
    expect(container.querySelector(".my-custom-class")).toBeInTheDocument();
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
    expect(textarea?.placeholder).toBe("Paste your data here...");
  });

  test("renders with value immediately (singleton highlighter actor)", () => {
    const { container } = render(
      <CodeEditor label="Input" value='{"a": 1}' onValueChange={() => {}} language="json" />,
    );
    expect(container.querySelector("textarea")).toBeInTheDocument();
    expect(container.textContent).toContain("Input");
  });
});
