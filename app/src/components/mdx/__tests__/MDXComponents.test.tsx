import { describe, test, expect, beforeAll } from "bun:test";
import { act, render, waitFor, type RenderResult } from "@testing-library/react";
import type { ReactNode } from "react";
import { mdxComponents } from "../MDXComponents";
import { getHighlighter } from "@/components/Codeblock";

beforeAll(async () => {
  await act(async () => {
    await getHighlighter();
  });
});

const Pre = mdxComponents.pre!;

async function renderPre(children: ReactNode): Promise<RenderResult> {
  let result: RenderResult | undefined;
  await act(async () => {
    result = render(<Pre>{children}</Pre>);
    await getHighlighter();
  });
  return result!;
}

describe("MDXComponents.pre", () => {
  test("renders via Codeblock (shiki-wrapper present)", async () => {
    const { container } = await renderPre(<code className="language-json">{"{"}</code>);
    expect(container.querySelector(".shiki-wrapper")).toBeInTheDocument();
  });

  test("shows code text in fallback during loading", async () => {
    const code = '{"key": "value"}';
    const { container } = await renderPre(<code className="language-json">{code}</code>);
    expect(container.textContent).toContain(code);
  });

  test("shows language badge when language is detected", async () => {
    const { container } = await renderPre(<code className="language-bash">ls -la</code>);
    const badge = container.querySelector(".shiki-wrapper > div");
    expect(badge).not.toBeNull();
    expect(badge?.textContent).toBe("bash");
  });

  test("hides language badge when no language class present", async () => {
    const { container } = await renderPre(<code>some code</code>);
    const badge = container.querySelector(".shiki-wrapper > span");
    expect(badge).toBeNull();
  });

  test("renders highlighted output after shiki resolves", async () => {
    const { container } = await renderPre(<code className="language-json">{"{"}</code>);
    await waitFor(() => {
      expect(container.querySelector(".shiki")).toBeInTheDocument();
    });
  });

  test("extracts language from data-language attribute", async () => {
    const { container } = await renderPre(
      <code data-language="typescript">const x = 1;</code>,
    );
    expect(container.textContent).toContain("typescript");
  });

  test("handles unsupported language without crashing", async () => {
    const { container } = await renderPre(<code className="language-html">{"<div />"}</code>);
    await waitFor(() => {
      expect(container.querySelector(".shiki-wrapper")).toBeInTheDocument();
    });
  });
});
