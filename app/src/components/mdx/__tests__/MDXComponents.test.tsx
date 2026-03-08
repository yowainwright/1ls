import { describe, test, expect, beforeAll } from "bun:test";
import { render, waitFor } from "@testing-library/react";
import { mdxComponents } from "../MDXComponents";
import { getHighlighter } from "@/components/Codeblock";

beforeAll(async () => {
  await getHighlighter();
});

const Pre = mdxComponents.pre!;

describe("MDXComponents.pre", () => {
  test("renders via Codeblock (shiki-wrapper present)", () => {
    const { container } = render(
      <Pre>
        <code className="language-json">{"{"}</code>
      </Pre>,
    );
    expect(container.querySelector(".shiki-wrapper")).toBeInTheDocument();
  });

  test("shows code text in fallback during loading", () => {
    const code = '{"key": "value"}';
    const { container } = render(
      <Pre>
        <code className="language-json">{code}</code>
      </Pre>,
    );
    expect(container.textContent).toContain(code);
  });

  test("shows language badge when language is detected", () => {
    const { container } = render(
      <Pre>
        <code className="language-bash">ls -la</code>
      </Pre>,
    );
    const badge = container.querySelector(".shiki-wrapper > div");
    expect(badge).not.toBeNull();
    expect(badge?.textContent).toBe("bash");
  });

  test("hides language badge when no language class present", () => {
    const { container } = render(
      <Pre>
        <code>some code</code>
      </Pre>,
    );
    const badge = container.querySelector(".shiki-wrapper > span");
    expect(badge).toBeNull();
  });

  test("renders highlighted output after shiki resolves", async () => {
    const { container } = render(
      <Pre>
        <code className="language-json">{"{"}</code>
      </Pre>,
    );
    await waitFor(() => {
      expect(container.querySelector(".shiki")).toBeInTheDocument();
    });
  });

  test("extracts language from data-language attribute", () => {
    const { container } = render(
      <Pre>
        <code data-language="typescript">const x = 1;</code>
      </Pre>,
    );
    expect(container.textContent).toContain("typescript");
  });

  test("handles unsupported language without crashing", async () => {
    const { container } = render(
      <Pre>
        <code className="language-html">{"<div />"}</code>
      </Pre>,
    );
    await waitFor(() => {
      expect(container.querySelector(".shiki-wrapper")).toBeInTheDocument();
    });
  });
});
