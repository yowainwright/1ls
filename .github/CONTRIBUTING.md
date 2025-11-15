# Contributing to 1ls

Thanks for your interest in contributing to 1ls! This guide will help you get started.

## Development Setup

1. Fork and clone the repository
2. Install Bun (recommended via mise or direct install from bun.sh)
3. Install dependencies: `bun install`

## Development Workflow

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Lint code: `bun run lint`
4. Type check: `bun run typecheck`
5. Run tests: `bun test`
6. Build project: `bun run build`

## Testing

- Unit tests: `bun test`
- Integration tests: `bun test test/integration/`
- Coverage: `bun run test:coverage`
- All checks: `bun run build && bun run lint && bun test`

## Code Style

- We use oxlint for linting
- All code must be formatted and linted before committing
- No code comments (code should be self-documenting)
- Functional programming patterns preferred:
  - Use `const` over `let`
  - Prefer `.map()`, `.filter()`, `.reduce()` over loops
  - Use `Object.assign()` instead of spread operators
  - Extract complex logic into well-named variables
  - Keep functions single-purpose and under 20 lines
  - Avoid nesting more than 2 levels deep

## Pull Request Process

1. Ensure all tests pass (`bun test`)
2. Ensure TypeScript compilation succeeds (`bun run build`)
3. Ensure linting passes (`bun run lint`)
4. Update documentation if needed (README.md, JSDoc comments)
5. Create a pull request with a clear description
6. Link any related issues

## Issue Reporting

When reporting issues, please include:

- Bun version (`bun --version`)
- Operating system (macOS, Linux, etc.)
- 1ls version (`1ls --version`)
- Minimal reproduction case
- Expected vs actual behavior
- Error messages and stack traces

## Feature Requests

When requesting features:

- Explain the use case
- Provide examples of how it would work
- Consider if it fits the project's goals (lightweight JSON CLI with JavaScript syntax)

## Questions?

Feel free to open an issue for questions or join discussions in existing issues.
