# 1ls Current Limitations and Future Features

## Parser Limitations

### Currently Not Supported
1. **Modulo operator (%)** - Cannot use `x % 2` in expressions
2. **Grouped expressions** - Parentheses for grouping not yet supported
3. **Complex binary operations** - Limited operator support in arrow functions
4. **Nested arrow functions** - Cannot nest arrow functions
5. **Object/array literals in expressions** - Cannot create new objects/arrays inline
6. **Ternary operators** - No support for `condition ? true : false`
7. **Logical operators** - Limited support for `&&`, `||`, `!`
8. **Equality operators** - Use `===` for now, `==` may not work as expected

### Workarounds

Instead of modulo:
```bash
# Not working:
1ls '.filter(x => x % 2 === 0)'

# Workaround - use external processing:
1ls '.filter(x => x / 2 === Math.floor(x / 2))'
```

Instead of complex expressions:
```bash
# Break into multiple operations:
1ls '.filter(x => x > 5)' | 1ls '.map(x => x * 2)'
```

## Currently Working Features

### ✅ Property Access
- Dot notation: `.name`, `.user.profile`
- Bracket notation: `["key-with-dash"]`
- Nested access: `.a.b.c.d`

### ✅ Array Operations
- Indexing: `[0]`, `[-1]`
- Slicing: `[1:3]`, `[:5]`, `[2:]`
- Methods: `map`, `filter`, `reduce`, `find`, `some`, `every`
- Utilities: `flat`, `join`, `includes`

### ✅ Object Operations
- `.{keys}` - Get object keys
- `.{values}` - Get object values
- `.{entries}` - Get key-value pairs
- `.{length}` - Get size

### ✅ Method Chaining
- `.filter(x => x > 5).map(x => x * 2)`
- Complex chains with reduce

### ✅ Input Formats
- JSON (auto-detected)
- YAML (auto-detected)
- TOML (auto-detected)
- CSV/TSV (auto-detected)
- Line-by-line text
- Plain text

### ✅ Shortcuts
- `.mp` → `.map`
- `.flt` → `.filter`
- `.rd` → `.reduce`
- `.fnd` → `.find`
- `.kys` → `.{keys}`
- `.vls` → `.{values}`
- And many more (use `1ls --shortcuts` to see all)

## Test Coverage

Current test suite validates:
- 47 passing features
- Basic property access
- Array operations
- Object operations
- Method chaining
- Input format parsing
- Shortcut expansions
- Real-world use cases

## Future Enhancements

Potential features to add:
1. Full JavaScript expression support
2. Custom functions
3. Variable assignment
4. Multi-line expressions
5. Output formatting options
6. Plugin system
7. Interactive mode
8. Config file support

## Using Tests to Define Features

The test suite in `test/current-features.test.ts` serves as:
1. **Living documentation** - Shows exactly what works
2. **Feature specification** - Defines expected behavior
3. **Regression prevention** - Ensures features keep working
4. **Examples** - Real-world usage patterns

To add a new feature:
1. Write a failing test that defines the feature
2. Implement the feature
3. Ensure the test passes
4. Document in this file

## Contributing

When adding features:
1. Start with tests
2. Keep the parser simple
3. Maintain backward compatibility
4. Update documentation
5. Add shortcuts for common operations