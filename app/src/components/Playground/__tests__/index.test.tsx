import { afterEach, beforeEach, describe, test, expect, mock } from "bun:test";
import { act, render, fireEvent, waitFor, type RenderResult } from "@testing-library/react";
import type { ReactElement } from "react";
import { getHighlighter } from "@/components/Codeblock";

mock.module("1ls/browser", () => ({
  evaluate: (data: unknown, expr: string) => {
    const fn = new Function("data", `with(data) { return data${expr} }`);
    return fn(data);
  },
  parseYAML: (s: string) => ({ raw: s }),
  parseCSV: (s: string) => s.split("\n").map((line) => line.split(",")),
  parseTOML: (s: string) => ({ raw: s }),
  expandShortcuts: (s: string) => s.replace(/\.flt/g, ".filter").replace(/\.mp/g, ".map"),
  shortenExpression: (s: string) => s.replace(/\.filter/g, ".flt").replace(/\.map/g, ".mp"),
}));

import { Playground, FORMAT_CONFIGS, FORMATS } from "../index";
import { SANDBOX_STARTER } from "../constants";

async function deletePlaygroundDatabase(): Promise<void> {
  const dbFactory = window.indexedDB;
  if (!dbFactory) return;
  await new Promise<void>((resolve) => {
    const request = dbFactory.deleteDatabase("1ls-playground");
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
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
      expect(result!.container.textContent).not.toContain("// Result will appear here");
    },
    { timeout: 1500 },
  );
  return result!;
}

function getButton(container: HTMLElement, label: string): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll("button")).find(
    (b) => b.textContent === label,
  );
  expect(button).toBeDefined();
  return button as HTMLButtonElement;
}

async function clickButton(container: HTMLElement, label: string): Promise<void> {
  const button = getButton(container, label);
  await act(async () => {
    fireEvent.click(button);
  });
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
    expect(container.textContent).toContain("Try It Live");
  });

  test("renders format tabs for all formats", async () => {
    const { container } = await renderSettled(<Playground />);
    for (const format of FORMATS) {
      expect(container.textContent).toContain(FORMAT_CONFIGS[format].label);
    }
  });

  test("renders input and expression editors", async () => {
    const { container } = await renderSettled(<Playground />);
    expect(container.textContent).toContain("Input");
    expect(container.textContent).toContain("Expression");
  });

  test("renders output panel", async () => {
    const { container } = await renderSettled(<Playground />);
    expect(container.textContent).toContain("Output");
  });

  test("shows preset data on initial render", async () => {
    const { container } = await renderSettled(<Playground />);
    expect(container.textContent).toContain("spotify");
  });

  test("evaluates expression and shows output", async () => {
    const { container } = await renderSettled(<Playground />);
    await waitFor(
      () => {
        expect(container.textContent).toContain("Chill Vibes");
      },
      { timeout: 1000 },
    );
  });

  test("changes format when tab is clicked", async () => {
    const { container } = await renderSettled(<Playground />);
    await clickButton(container, "YAML");
    await settleDelayedPlaygroundEffects();
    await waitFor(() => {
      expect(container.textContent).toContain("pokemon");
    });
  });

  test("shows suggestion buttons in preset mode", async () => {
    const { container } = await renderSettled(<Playground />);
    expect(container.textContent).toContain("Try:");
  });
});

describe("Playground - Sandbox Mode", () => {
  test("renders section header with 'Playground'", async () => {
    const { container } = await renderSettled(<Playground mode="sandbox" />);
    expect(container.textContent).toContain("Playground");
  });

  test("shows sandbox starter data for JSON", async () => {
    const { container } = await renderSettled(<Playground mode="sandbox" />);
    expect(container.textContent).toContain("Alice");
    expect(container.textContent).toContain("Bob");
    expect(container.textContent).toContain("Charlie");
  });

  test("shows sandbox starter expression", async () => {
    const { container } = await renderSettled(<Playground mode="sandbox" />);
    expect(container.textContent).toContain(".users.filter");
  });

  test("does not show suggestion buttons in sandbox mode", async () => {
    const { container } = await renderSettled(<Playground mode="sandbox" />);
    expect(container.textContent).not.toContain("Try:");
  });

  test("changes to YAML starter data when YAML tab clicked", async () => {
    const { container } = await renderSettled(<Playground mode="sandbox" />);
    await clickButton(container, "YAML");
    await settleDelayedPlaygroundEffects();
    await waitFor(() => {
      expect(container.textContent).toContain("name: Alice");
    });
  });

  test("changes to CSV starter data when CSV tab clicked", async () => {
    const { container } = await renderSettled(<Playground mode="sandbox" />);
    await clickButton(container, "CSV");
    await settleDelayedPlaygroundEffects();
    await waitFor(() => {
      expect(container.textContent).toContain("name,age,active");
    });
  });

  test("changes to TOML starter data when TOML tab clicked", async () => {
    const { container } = await renderSettled(<Playground mode="sandbox" />);
    await clickButton(container, "TOML");
    await settleDelayedPlaygroundEffects();
    await waitFor(() => {
      expect(container.textContent).toContain("[user]");
    });
  });

  test("changes to Text starter data when Text tab clicked", async () => {
    const { container } = await renderSettled(<Playground mode="sandbox" />);
    await clickButton(container, "Text");
    await settleDelayedPlaygroundEffects();
    await waitFor(() => {
      expect(container.textContent).toContain("INFO:");
    });
  });
});

describe("Playground - Minify Feature", () => {
  test("renders minify button", async () => {
    const { container } = await renderSettled(<Playground mode="sandbox" />);
    expect(container.textContent).toContain("Minify");
  });

  test("shows minified expression when minify button clicked", async () => {
    const { container } = await renderSettled(<Playground mode="sandbox" />);
    await clickButton(container, "Minify");
    await waitFor(() => {
      expect(container.textContent).toContain("Hide Minified");
      expect(container.textContent).toContain(".flt");
    });
  });

  test("hides minified expression when hide button clicked", async () => {
    const { container } = await renderSettled(<Playground mode="sandbox" />);
    await clickButton(container, "Minify");
    await waitFor(() => {
      expect(container.textContent).toContain("Hide Minified");
    });
    await clickButton(container, "Hide Minified");
    await waitFor(() => {
      expect(container.textContent).toContain("Minify");
      expect(container.textContent).not.toContain("Hide Minified");
    });
  });
});

describe("SANDBOX_STARTER", () => {
  test("has starter data for all formats", () => {
    for (const format of FORMATS) {
      expect(SANDBOX_STARTER[format]).toBeDefined();
      expect(SANDBOX_STARTER[format].data).toBeDefined();
      expect(SANDBOX_STARTER[format].expression).toBeDefined();
    }
  });

  test("JSON starter has valid JSON data", () => {
    expect(() => JSON.parse(SANDBOX_STARTER.json.data)).not.toThrow();
  });

  test("all starters have non-empty expressions", () => {
    for (const format of FORMATS) {
      expect(SANDBOX_STARTER[format].expression.length).toBeGreaterThan(0);
    }
  });
});

describe("Playground - Syntax Highlighting", () => {
  test("applies Shiki highlighting to input after highlighter loads", async () => {
    const { container } = await renderSettled(<Playground />);

    await waitFor(
      () => {
        const shikiSpans = container.querySelectorAll(".shiki span[style]");
        expect(shikiSpans.length).toBeGreaterThan(0);
      },
      { timeout: 3000 },
    );
  });

  test("highlights JSON input with appropriate syntax colors", async () => {
    const { container } = await renderSettled(<Playground />);

    await waitFor(
      () => {
        const highlightedContent = container.querySelector(".shiki");
        expect(highlightedContent).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  test("highlights expression editor with JavaScript syntax", async () => {
    const { container } = await renderSettled(<Playground />);

    await waitFor(
      () => {
        const editors = container.querySelectorAll(".shiki");
        expect(editors.length).toBeGreaterThanOrEqual(1);
      },
      { timeout: 3000 },
    );
  });

  test("updates highlighting when format changes to YAML", async () => {
    const { container } = await renderSettled(<Playground />);
    await clickButton(container, "YAML");
    await settleDelayedPlaygroundEffects();

    await waitFor(
      () => {
        expect(container.textContent).toContain("pokemon");
        const highlightedEditor = Array.from(container.querySelectorAll("pre[aria-hidden='true']")).find(
          (pre) => pre.textContent?.includes("pokemon"),
        );
        expect(highlightedEditor).not.toBeNull();
      },
      { timeout: 3000 },
    );
  });

  test("updates highlighting when format changes to TOML", async () => {
    const { container } = await renderSettled(<Playground />);
    await clickButton(container, "TOML");
    await settleDelayedPlaygroundEffects();

    await waitFor(
      () => {
        expect(container.textContent).toContain("[game]");
        const highlightedEditor = Array.from(container.querySelectorAll("pre[aria-hidden='true']")).find(
          (pre) => pre.textContent?.includes("[game]"),
        );
        expect(highlightedEditor).not.toBeNull();
      },
      { timeout: 3000 },
    );
  });
});
