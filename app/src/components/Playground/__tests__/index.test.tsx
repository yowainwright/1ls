import { describe, test, expect, mock } from "bun:test"
import { render, fireEvent, waitFor } from "@testing-library/react"

mock.module("1ls/browser", () => ({
  evaluate: (data: unknown, expr: string) => {
    const fn = new Function("data", `with(data) { return data${expr} }`)
    return fn(data)
  },
  parseYAML: (s: string) => ({ raw: s }),
  parseCSV: (s: string) => s.split("\n").map(line => line.split(",")),
  parseTOML: (s: string) => ({ raw: s }),
  expandShortcuts: (s: string) => s.replace(/\.flt/g, ".filter").replace(/\.mp/g, ".map"),
  shortenExpression: (s: string) => s.replace(/\.filter/g, ".flt").replace(/\.map/g, ".mp"),
}))

import { Playground, FORMAT_CONFIGS, FORMATS } from "../index"
import { SANDBOX_STARTER } from "../constants"

describe("Playground - Preset Mode", () => {
  test("renders section header with 'Try It Live'", () => {
    const { container } = render(<Playground />)
    expect(container.textContent).toContain("Try It Live")
  })

  test("renders format tabs for all formats", () => {
    const { container } = render(<Playground />)
    for (const format of FORMATS) {
      expect(container.textContent).toContain(FORMAT_CONFIGS[format].label)
    }
  })

  test("renders input and expression editors", () => {
    const { container } = render(<Playground />)
    expect(container.textContent).toContain("Input")
    expect(container.textContent).toContain("Expression")
  })

  test("renders output panel", () => {
    const { container } = render(<Playground />)
    expect(container.textContent).toContain("Output")
  })

  test("shows preset data on initial render", () => {
    const { container } = render(<Playground />)
    expect(container.textContent).toContain("spotify")
  })

  test("evaluates expression and shows output", async () => {
    const { container } = render(<Playground />)
    await waitFor(
      () => {
        expect(container.textContent).toContain("Chill Vibes")
      },
      { timeout: 1000 }
    )
  })

  test("changes format when tab is clicked", async () => {
    const { container } = render(<Playground />)
    const buttons = container.querySelectorAll('button')
    const yamlButton = Array.from(buttons).find(b => b.textContent === 'YAML')
    if (yamlButton) {
      fireEvent.click(yamlButton)
    }
    await waitFor(() => {
      expect(container.textContent).toContain("pokemon")
    })
  })

  test("shows suggestion buttons in preset mode", () => {
    const { container } = render(<Playground />)
    expect(container.textContent).toContain("Try:")
  })
})

describe("Playground - Sandbox Mode", () => {
  test("renders section header with 'Playground'", () => {
    const { container } = render(<Playground mode="sandbox" />)
    expect(container.textContent).toContain("Playground")
  })

  test("shows sandbox starter data for JSON", () => {
    const { container } = render(<Playground mode="sandbox" />)
    expect(container.textContent).toContain("Alice")
    expect(container.textContent).toContain("Bob")
    expect(container.textContent).toContain("Charlie")
  })

  test("shows sandbox starter expression", () => {
    const { container } = render(<Playground mode="sandbox" />)
    expect(container.textContent).toContain(".users.filter")
  })

  test("does not show suggestion buttons in sandbox mode", () => {
    const { container } = render(<Playground mode="sandbox" />)
    expect(container.textContent).not.toContain("Try:")
  })

  test("changes to YAML starter data when YAML tab clicked", async () => {
    const { container } = render(<Playground mode="sandbox" />)
    const buttons = container.querySelectorAll('button')
    const yamlButton = Array.from(buttons).find(b => b.textContent === 'YAML')
    if (yamlButton) {
      fireEvent.click(yamlButton)
    }
    await waitFor(() => {
      expect(container.textContent).toContain("name: Alice")
    })
  })

  test("changes to CSV starter data when CSV tab clicked", async () => {
    const { container } = render(<Playground mode="sandbox" />)
    const buttons = container.querySelectorAll('button')
    const csvButton = Array.from(buttons).find(b => b.textContent === 'CSV')
    if (csvButton) {
      fireEvent.click(csvButton)
    }
    await waitFor(() => {
      expect(container.textContent).toContain("name,age,active")
    })
  })

  test("changes to TOML starter data when TOML tab clicked", async () => {
    const { container } = render(<Playground mode="sandbox" />)
    const buttons = container.querySelectorAll('button')
    const tomlButton = Array.from(buttons).find(b => b.textContent === 'TOML')
    if (tomlButton) {
      fireEvent.click(tomlButton)
    }
    await waitFor(() => {
      expect(container.textContent).toContain("[user]")
    })
  })

  test("changes to Text starter data when Text tab clicked", async () => {
    const { container } = render(<Playground mode="sandbox" />)
    const buttons = container.querySelectorAll('button')
    const textButton = Array.from(buttons).find(b => b.textContent === 'Text')
    if (textButton) {
      fireEvent.click(textButton)
    }
    await waitFor(() => {
      expect(container.textContent).toContain("INFO:")
    })
  })
})

describe("Playground - Minify Feature", () => {
  test("renders minify button", () => {
    const { container } = render(<Playground mode="sandbox" />)
    expect(container.textContent).toContain("Minify")
  })

  test("shows minified expression when minify button clicked", async () => {
    const { container } = render(<Playground mode="sandbox" />)
    const buttons = container.querySelectorAll('button')
    const minifyButton = Array.from(buttons).find(b => b.textContent === 'Minify')
    if (minifyButton) {
      fireEvent.click(minifyButton)
    }
    await waitFor(() => {
      expect(container.textContent).toContain("Hide Minified")
      expect(container.textContent).toContain(".flt")
    })
  })

  test("hides minified expression when hide button clicked", async () => {
    const { container } = render(<Playground mode="sandbox" />)
    const buttons = container.querySelectorAll('button')
    const minifyButton = Array.from(buttons).find(b => b.textContent === 'Minify')
    if (minifyButton) {
      fireEvent.click(minifyButton)
    }
    await waitFor(() => {
      expect(container.textContent).toContain("Hide Minified")
    })
    const hideButton = Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'Hide Minified')
    if (hideButton) {
      fireEvent.click(hideButton)
    }
    await waitFor(() => {
      expect(container.textContent).toContain("Minify")
      expect(container.textContent).not.toContain("Hide Minified")
    })
  })
})

describe("SANDBOX_STARTER", () => {
  test("has starter data for all formats", () => {
    for (const format of FORMATS) {
      expect(SANDBOX_STARTER[format]).toBeDefined()
      expect(SANDBOX_STARTER[format].data).toBeDefined()
      expect(SANDBOX_STARTER[format].expression).toBeDefined()
    }
  })

  test("JSON starter has valid JSON data", () => {
    expect(() => JSON.parse(SANDBOX_STARTER.json.data)).not.toThrow()
  })

  test("all starters have non-empty expressions", () => {
    for (const format of FORMATS) {
      expect(SANDBOX_STARTER[format].expression.length).toBeGreaterThan(0)
    }
  })
})

describe("Playground - Syntax Highlighting", () => {
  test("applies Shiki highlighting to input after highlighter loads", async () => {
    const { container } = render(<Playground />)

    await waitFor(
      () => {
        const shikiSpans = container.querySelectorAll(".shiki span[style]")
        expect(shikiSpans.length).toBeGreaterThan(0)
      },
      { timeout: 3000 }
    )
  })

  test("highlights JSON input with appropriate syntax colors", async () => {
    const { container } = render(<Playground />)

    await waitFor(
      () => {
        const highlightedContent = container.querySelector(".shiki")
        expect(highlightedContent).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  test("highlights expression editor with JavaScript syntax", async () => {
    const { container } = render(<Playground />)

    await waitFor(
      () => {
        const editors = container.querySelectorAll(".shiki")
        expect(editors.length).toBeGreaterThanOrEqual(1)
      },
      { timeout: 3000 }
    )
  })

  test("updates highlighting when format changes to YAML", async () => {
    const { container } = render(<Playground />)
    const buttons = container.querySelectorAll("button")
    const yamlButton = Array.from(buttons).find((b) => b.textContent === "YAML")

    if (yamlButton) {
      fireEvent.click(yamlButton)
    }

    await waitFor(
      () => {
        expect(container.textContent).toContain("pokemon")
        const shikiContent = container.querySelector(".shiki")
        expect(shikiContent).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  test("updates highlighting when format changes to TOML", async () => {
    const { container } = render(<Playground />)
    const buttons = container.querySelectorAll("button")
    const tomlButton = Array.from(buttons).find((b) => b.textContent === "TOML")

    if (tomlButton) {
      fireEvent.click(tomlButton)
    }

    await waitFor(
      () => {
        expect(container.textContent).toContain("[game]")
        const shikiContent = container.querySelector(".shiki")
        expect(shikiContent).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })
})
