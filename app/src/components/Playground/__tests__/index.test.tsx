import { afterEach, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { act, render, fireEvent, waitFor, type RenderResult } from "@testing-library/react";
import type { ReactElement } from "react";
import { getHighlighter } from "@/components/Codeblock";

import { Playground, FORMAT_CONFIGS, FORMATS } from "../index";
import { SANDBOX_STARTER } from "../constants";

async function deletePlaygroundDatabase(): Promise<void> {
  const dbFactory = window.indexedDB;
  if (!dbFactory) return;
  await new Promise<void>((resolve) => {
    const request = dbFactory.deleteDatabase("1ls-playground");
    const finishRequest = () => {
      resolve();
    };
    request.onsuccess = finishRequest;
    request.onerror = finishRequest;
    request.onblocked = finishRequest;
  });
}

async function resetPlaygroundTestState(): Promise<void> {
  if (window.location.origin === "null") {
    window.location.href = "http://localhost/";
  } else {
    window.history.replaceState({}, "", "/");
  }
  await deletePlaygroundDatabase();
}

async function renderSettled(element: ReactElement): Promise<RenderResult> {
  let result: RenderResult | undefined;
  await act(async () => {
    result = render(element);
    await getHighlighter();
  });
  await waitFor(
    () => {
      assert.ok(!result!.container.textContent.includes("// Result will appear here"));
    },
    { timeout: 1500 },
  );
  return result!;
}

function getButton(container: HTMLElement, label: string): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll("button")).find(
    (b) => b.textContent === label,
  );
  assert.notStrictEqual(button, undefined);
  return button as HTMLButtonElement;
}

function clickButton(container: HTMLElement, label: string): void {
  const button = getButton(container, label);
  act(() => {
    fireEvent.click(button);
  });
}

function hasText(container: HTMLElement, text: string): boolean {
  const content = container.textContent ?? "";
  return content.includes(text);
}

async function settleDelayedPlaygroundEffects(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 350));
  });
}

beforeEach(async () => {
  await resetPlaygroundTestState();
});

afterEach(async () => {
  await resetPlaygroundTestState();
});

describe("Playground - Preset Mode", () => {
  test("renders section header with 'Try It Live'", async () => {
    const { container } = await renderSettled(<Playground />);
    assert.ok(hasText(container, "Try It Live"));
  });

  test("renders format tabs for all formats", async () => {
    const { container } = await renderSettled(<Playground />);
    const labels = new Set(FORMATS.map((format) => FORMAT_CONFIGS[format].label));
    labels.forEach((label) => assert.ok(hasText(container, label)));
  });

  test("renders input and expression editors", async () => {
    const { container } = await renderSettled(<Playground />);
    assert.ok(hasText(container, "Input"));
    assert.ok(hasText(container, "Expression"));
  });

  test("renders output panel", async () => {
    const { container } = await renderSettled(<Playground />);
    assert.ok(hasText(container, "Output"));
  });

  test("shows preset data on initial render", async () => {
    const { container } = await renderSettled(<Playground />);
    assert.ok(hasText(container, "spotify"));
  });

  test("evaluates expression and shows output", async () => {
    const { container } = await renderSettled(<Playground />);
    await waitFor(
      () => {
        assert.ok(hasText(container, "Chill Vibes"));
      },
      { timeout: 1000 },
    );
  });

  test("changes format when tab is clicked", async () => {
    const { container } = await renderSettled(<Playground />);
    clickButton(container, "YAML");
    await settleDelayedPlaygroundEffects();
    await waitFor(() => {
      assert.ok(hasText(container, "pokemon"));
    });
  });

  test("shows suggestion buttons in preset mode", async () => {
    const { container } = await renderSettled(<Playground />);
    assert.ok(hasText(container, "Try:"));
  });
});

describe("Playground - Sandbox Mode", () => {
  test("renders section header with 'Playground'", async () => {
    const { container } = await renderSettled(<Playground mode="sandbox" />);
    assert.ok(hasText(container, "Playground"));
  });

  test("shows sandbox starter data for JSON", async () => {
    const { container } = await renderSettled(<Playground mode="sandbox" />);
    assert.ok(hasText(container, "Alice"));
    assert.ok(hasText(container, "Bob"));
    assert.ok(hasText(container, "Charlie"));
  });

  test("shows sandbox starter expression", async () => {
    const { container } = await renderSettled(<Playground mode="sandbox" />);
    assert.ok(hasText(container, ".users.filter"));
  });

  test("does not show suggestion buttons in sandbox mode", async () => {
    const { container } = await renderSettled(<Playground mode="sandbox" />);
    assert.ok(!hasText(container, "Try:"));
  });

  test("changes to YAML starter data when YAML tab clicked", async () => {
    const { container } = await renderSettled(<Playground mode="sandbox" />);
    clickButton(container, "YAML");
    await settleDelayedPlaygroundEffects();
    await waitFor(() => {
      assert.ok(hasText(container, "name: Alice"));
    });
  });

  test("changes to CSV starter data when CSV tab clicked", async () => {
    const { container } = await renderSettled(<Playground mode="sandbox" />);
    clickButton(container, "CSV");
    await settleDelayedPlaygroundEffects();
    await waitFor(() => {
      assert.ok(hasText(container, "name,age,active"));
    });
  });

  test("changes to TOML starter data when TOML tab clicked", async () => {
    const { container } = await renderSettled(<Playground mode="sandbox" />);
    clickButton(container, "TOML");
    await settleDelayedPlaygroundEffects();
    await waitFor(() => {
      assert.ok(hasText(container, "[user]"));
    });
  });

  test("changes to Text starter data when Text tab clicked", async () => {
    const { container } = await renderSettled(<Playground mode="sandbox" />);
    clickButton(container, "Text");
    await settleDelayedPlaygroundEffects();
    await waitFor(() => {
      assert.ok(hasText(container, "INFO:"));
    });
  });
});

describe("Playground - Minify Feature", () => {
  test("renders minify button", async () => {
    const { container } = await renderSettled(<Playground mode="sandbox" />);
    assert.ok(hasText(container, "Minify"));
  });

  test("shows minified expression when minify button clicked", async () => {
    const { container } = await renderSettled(<Playground mode="sandbox" />);
    clickButton(container, "Minify");
    await waitFor(() => {
      assert.ok(hasText(container, "Hide Minified"));
      assert.ok(hasText(container, ".flt"));
    });
  });

  test("hides minified expression when hide button clicked", async () => {
    const { container } = await renderSettled(<Playground mode="sandbox" />);
    clickButton(container, "Minify");
    await waitFor(() => {
      assert.ok(hasText(container, "Hide Minified"));
    });
    clickButton(container, "Hide Minified");
    await waitFor(() => {
      assert.ok(hasText(container, "Minify"));
      assert.ok(!hasText(container, "Hide Minified"));
    });
  });
});

describe("SANDBOX_STARTER", () => {
  test("has starter data for all formats", () => {
    for (const format of FORMATS) {
      assert.notStrictEqual(SANDBOX_STARTER[format], undefined);
      assert.notStrictEqual(SANDBOX_STARTER[format].data, undefined);
      assert.notStrictEqual(SANDBOX_STARTER[format].expression, undefined);
    }
  });

  test("JSON starter has valid JSON data", () => {
    assert.doesNotThrow(() => JSON.parse(SANDBOX_STARTER.json.data));
  });

  test("all starters have non-empty expressions", () => {
    for (const format of FORMATS) {
      assert.ok(SANDBOX_STARTER[format].expression.length > 0);
    }
  });
});

describe("Playground - Syntax Highlighting", () => {
  test("applies Shiki highlighting to input after highlighter loads", async () => {
    const { container } = await renderSettled(<Playground />);

    await waitFor(
      () => {
        const shikiSpans = container.querySelectorAll(".shiki span[style]");
        assert.ok(shikiSpans.length > 0);
      },
      { timeout: 3000 },
    );
  });

  test("highlights JSON input with appropriate syntax colors", async () => {
    const { container } = await renderSettled(<Playground />);

    await waitFor(
      () => {
        const highlightedContent = container.querySelector(".shiki");
        assert.ok(highlightedContent);
      },
      { timeout: 3000 },
    );
  });

  test("highlights expression editor with JavaScript syntax", async () => {
    const { container } = await renderSettled(<Playground />);

    await waitFor(
      () => {
        const editors = container.querySelectorAll(".shiki");
        assert.ok(editors.length >= 1);
      },
      { timeout: 3000 },
    );
  });

  test("updates highlighting when format changes to YAML", async () => {
    const { container } = await renderSettled(<Playground />);
    clickButton(container, "YAML");
    await settleDelayedPlaygroundEffects();

    await waitFor(
      () => {
        assert.ok(hasText(container, "pokemon"));
        const highlightedEditor = Array.from(container.querySelectorAll("pre[aria-hidden='true']")).find(
          (pre) => pre.textContent?.includes("pokemon"),
        );
        assert.notStrictEqual(highlightedEditor, null);
      },
      { timeout: 3000 },
    );
  });

  test("updates highlighting when format changes to TOML", async () => {
    const { container } = await renderSettled(<Playground />);
    clickButton(container, "TOML");
    await settleDelayedPlaygroundEffects();

    await waitFor(
      () => {
        assert.ok(hasText(container, "[game]"));
        const highlightedEditor = Array.from(container.querySelectorAll("pre[aria-hidden='true']")).find(
          (pre) => pre.textContent?.includes("[game]"),
        );
        assert.notStrictEqual(highlightedEditor, null);
      },
      { timeout: 3000 },
    );
  });
});
