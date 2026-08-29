import { describe, test, before as beforeAll } from "node:test";
import assert from "node:assert/strict";
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
    assert.ok(container.querySelector(".shiki-wrapper"));
  });

  test("shows code text in fallback during loading", async () => {
    const code = '{"key": "value"}';
    const { container } = await renderPre(<code className="language-json">{code}</code>);
    assert.ok(container.textContent.includes(code));
  });

  test("shows language badge when language is detected", async () => {
    const { container } = await renderPre(<code className="language-bash">ls -la</code>);
    const badge = container.querySelector(".shiki-wrapper > div");
    assert.notStrictEqual(badge, null);
    assert.strictEqual(badge?.textContent, "bash");
  });

  test("hides language badge when no language class present", async () => {
    const { container } = await renderPre(<code>some code</code>);
    const badge = container.querySelector(".shiki-wrapper > span");
    assert.strictEqual(badge, null);
  });

  test("renders highlighted output after shiki resolves", async () => {
    const { container } = await renderPre(<code className="language-json">{"{"}</code>);
    await waitFor(() => {
      assert.ok(container.querySelector(".shiki"));
    });
  });

  test("extracts language from data-language attribute", async () => {
    const { container } = await renderPre(
      <code data-language="typescript">const x = 1;</code>,
    );
    assert.ok(container.textContent.includes("typescript"));
  });

  test("handles unsupported language without crashing", async () => {
    const { container } = await renderPre(<code className="language-html">{"<div />"}</code>);
    await waitFor(() => {
      assert.ok(container.querySelector(".shiki-wrapper"));
    });
  });
});
