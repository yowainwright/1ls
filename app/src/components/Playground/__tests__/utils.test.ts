import { describe, test, expect, mock } from "bun:test"

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

import {
  detectFormat,
  detectJSON,
  detectYAML,
  detectCSV,
  detectTOML,
  detectMalformedJSON,
  isValidJSON,
  looksLikeJSON,
  countCommas,
  hasConsistentCommaCount,
  minifyExpression,
  expandExpression,
  runEvaluation,
  DETECTORS,
} from "../utils"

describe("isValidJSON", () => {
  test("returns true for valid JSON object", () => {
    expect(isValidJSON('{"name": "test"}')).toBe(true)
  })

  test("returns true for valid JSON array", () => {
    expect(isValidJSON('[1, 2, 3]')).toBe(true)
  })

  test("returns false for invalid JSON", () => {
    expect(isValidJSON('{name: test}')).toBe(false)
  })

  test("returns false for plain text", () => {
    expect(isValidJSON('hello world')).toBe(false)
  })
})

describe("looksLikeJSON", () => {
  test("returns true for content starting with {", () => {
    expect(looksLikeJSON('{"test": true}')).toBe(true)
  })

  test("returns true for content starting with [", () => {
    expect(looksLikeJSON('[1, 2, 3]')).toBe(true)
  })

  test("returns false for content starting with other characters", () => {
    expect(looksLikeJSON('name: value')).toBe(false)
  })
})

describe("countCommas", () => {
  test("counts commas correctly", () => {
    expect(countCommas("a,b,c")).toBe(2)
  })

  test("returns 0 for no commas", () => {
    expect(countCommas("abc")).toBe(0)
  })

  test("handles empty string", () => {
    expect(countCommas("")).toBe(0)
  })
})

describe("hasConsistentCommaCount", () => {
  test("returns true for consistent CSV lines", () => {
    const lines = ["name,age,city", "Alice,30,NYC", "Bob,25,LA"]
    expect(hasConsistentCommaCount(lines)).toBe(true)
  })

  test("returns false for inconsistent comma counts", () => {
    const lines = ["name,age,city", "Alice,30", "Bob,25,LA"]
    expect(hasConsistentCommaCount(lines)).toBe(false)
  })

  test("returns false for single line", () => {
    const lines = ["name,age,city"]
    expect(hasConsistentCommaCount(lines)).toBe(false)
  })

  test("returns false for lines with no commas", () => {
    const lines = ["name", "Alice", "Bob"]
    expect(hasConsistentCommaCount(lines)).toBe(false)
  })
})

describe("detectJSON", () => {
  test("detects valid JSON object", () => {
    const result = detectJSON('{"name": "test"}')
    expect(result).not.toBeNull()
    expect(result?.format).toBe("json")
    expect(result?.confidence).toBe(1.0)
  })

  test("detects valid JSON array", () => {
    const result = detectJSON('[1, 2, 3]')
    expect(result).not.toBeNull()
    expect(result?.format).toBe("json")
  })

  test("returns null for non-JSON content", () => {
    expect(detectJSON('name: value')).toBeNull()
  })

  test("returns null for malformed JSON", () => {
    expect(detectJSON('{invalid json}')).toBeNull()
  })
})

describe("detectYAML", () => {
  test("detects YAML with list items", () => {
    const yaml = `items:
  - item1
  - item2`
    const result = detectYAML(yaml)
    expect(result).not.toBeNull()
    expect(result?.format).toBe("yaml")
  })

  test("detects YAML with key-value pairs", () => {
    const yaml = `name: Alice
age: 30`
    const result = detectYAML(yaml)
    expect(result).not.toBeNull()
    expect(result?.format).toBe("yaml")
  })

  test("returns null for non-YAML content", () => {
    expect(detectYAML('just plain text')).toBeNull()
  })
})

describe("detectCSV", () => {
  test("detects valid CSV", () => {
    const csv = `name,age,city
Alice,30,NYC
Bob,25,LA`
    const result = detectCSV(csv)
    expect(result).not.toBeNull()
    expect(result?.format).toBe("csv")
  })

  test("returns null for inconsistent CSV", () => {
    const csv = `name,age,city
Alice,30
Bob,25,LA`
    expect(detectCSV(csv)).toBeNull()
  })

  test("returns null for single line", () => {
    expect(detectCSV('name,age,city')).toBeNull()
  })
})

describe("detectTOML", () => {
  test("detects TOML with sections and assignments", () => {
    const toml = `[section]
name = "test"
value = 123`
    const result = detectTOML(toml)
    expect(result).not.toBeNull()
    expect(result?.format).toBe("toml")
  })

  test("returns null without section headers", () => {
    const content = `name = "test"`
    expect(detectTOML(content)).toBeNull()
  })

  test("returns null without assignments", () => {
    const content = `[section]
just text`
    expect(detectTOML(content)).toBeNull()
  })
})

describe("detectMalformedJSON", () => {
  test("detects content that looks like JSON", () => {
    const result = detectMalformedJSON('{invalid json}')
    expect(result).not.toBeNull()
    expect(result?.format).toBe("json")
    expect(result?.confidence).toBe(0.6)
  })

  test("returns null for non-JSON-like content", () => {
    expect(detectMalformedJSON('name: value')).toBeNull()
  })
})

describe("detectFormat", () => {
  test("detects JSON", () => {
    const result = detectFormat('{"name": "test"}')
    expect(result.format).toBe("json")
    expect(result.confidence).toBe(1.0)
  })

  test("detects YAML", () => {
    const yaml = `name: Alice
age: 30`
    const result = detectFormat(yaml)
    expect(result.format).toBe("yaml")
  })

  test("detects CSV", () => {
    const csv = `name,age
Alice,30
Bob,25`
    const result = detectFormat(csv)
    expect(result.format).toBe("csv")
  })

  test("detects TOML", () => {
    const toml = `[section]
name = "test"`
    const result = detectFormat(toml)
    expect(result.format).toBe("toml")
  })

  test("returns text for unrecognized content", () => {
    const result = detectFormat('just some plain text')
    expect(result.format).toBe("text")
  })

  test("returns text for empty content", () => {
    const result = detectFormat('')
    expect(result.format).toBe("text")
    expect(result.confidence).toBe(1.0)
  })

  test("returns text for whitespace-only content", () => {
    const result = detectFormat('   \n   ')
    expect(result.format).toBe("text")
  })
})

describe("DETECTORS array", () => {
  test("contains all format detectors", () => {
    expect(DETECTORS.length).toBe(5)
  })

  test("detectors are functions", () => {
    DETECTORS.forEach(detector => {
      expect(typeof detector).toBe("function")
    })
  })
})

describe("minifyExpression", () => {
  test("shortens .filter to .flt", () => {
    const result = minifyExpression('.filter(x => x)')
    expect(result).toContain('.flt')
  })

  test("shortens .map to .mp", () => {
    const result = minifyExpression('.map(x => x * 2)')
    expect(result).toContain('.mp')
  })

  test("shortens multiple methods", () => {
    const result = minifyExpression('.filter(x => x).map(y => y)')
    expect(result).toContain('.flt')
    expect(result).toContain('.mp')
  })
})

describe("expandExpression", () => {
  test("expands .flt to .filter", () => {
    const result = expandExpression('.flt(x => x)')
    expect(result).toContain('.filter')
  })

  test("expands .mp to .map", () => {
    const result = expandExpression('.mp(x => x * 2)')
    expect(result).toContain('.map')
  })

  test("expands multiple shortcuts", () => {
    const result = expandExpression('.flt(x => x).mp(y => y)')
    expect(result).toContain('.filter')
    expect(result).toContain('.map')
  })
})

describe("runEvaluation", () => {
  test("evaluates JSON expression correctly", () => {
    const input = '{"users": [{"name": "Alice"}, {"name": "Bob"}]}'
    const expression = '.users.map(u => u.name)'
    const result = runEvaluation(input, expression, "json")
    expect(result.error).toBeNull()
    expect(result.output).toContain("Alice")
    expect(result.output).toContain("Bob")
  })

  test("returns empty output for empty input", () => {
    const result = runEvaluation('', '.test', 'json')
    expect(result.output).toBe("")
    expect(result.error).toBeNull()
  })

  test("returns empty output for empty expression", () => {
    const result = runEvaluation('{"test": true}', '', 'json')
    expect(result.output).toBe("")
    expect(result.error).toBeNull()
  })

  test("returns error for invalid JSON input", () => {
    const result = runEvaluation('{invalid}', '.test', 'json')
    expect(result.error).not.toBeNull()
  })

  test("evaluates text format as array of lines", () => {
    const input = "line1\nline2\nline3"
    const expression = '.{length}'
    const result = runEvaluation(input, expression, "text")
    expect(result.error).toBeNull()
    expect(result.output).toContain("3")
  })
})
