# Contributing to 1ls

Thanks for your interest in contributing to 1ls! This guide will help you get started.

## Development Setup

1. Fork and clone the repository
2. Install Node 24+
3. Install dependencies: `pnpm install`

## Development Workflow

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Lint code: `pnpm run lint`
4. Type check: `pnpm run typecheck`
5. Run tests: `pnpm test`
6. Build project: `pnpm run build`

## Testing

- Unit tests: `pnpm test`
- Integration tests: `pnpm run test:integration`
- Coverage: `pnpm run test:coverage`
- All checks: `pnpm run build && pnpm run lint && pnpm test`

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

1. Ensure all tests pass (`pnpm test`)
2. Ensure TypeScript compilation succeeds (`pnpm run build`)
3. Ensure linting passes (`pnpm run lint`)
4. Update documentation if needed (README.md, JSDoc comments)
5. Create a pull request with a clear description
6. Link any related issues

## Issue Reporting

When reporting issues, please include:

- Node version (`node --version`)
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
