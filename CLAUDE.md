# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is @stellarwp/changelogger, a TypeScript-based changelog management tool that works both as a GitHub Action and CLI tool. It manages changelog entries through individual YAML change files in a changelog directory.

## Key Commands

### Development Commands

```bash
# Install dependencies
npm ci

# Build the project (includes format fix, checks, compilation, and packaging)
npm run build

# Compile TypeScript to JavaScript
npm run build:compile

# Package for distribution (creates dist/)
npm run build:package

# Build GitHub Action distribution
npm run build:gha

# Run all checks (TypeScript, format, lint) in parallel
npm run check

# TypeScript type checking (no emit)
npm run check:build

# Check code formatting
npm run check:format

# Run ESLint
npm run check:lint

# Fix formatting issues
npm run fix:format

# Run tests with Jest (uses TypeScript)
npm test
```

### Changelog Commands (after building)

```bash
# Add a new changelog entry (interactive)
npm run changelog add

# Validate all change files
npm run changelog validate

# Write changes to configured files
npm run changelog write
```

## Architecture

### Core Structure

- **src/cli.ts**: Entry point for CLI commands
- **src/github.ts**: Entry point for GitHub Action
- **src/main.ts**: Main module exports for library usage
- **src/commands/**: Command implementations (add, validate, write)
- **src/utils/**: Utility modules for configuration, files, git, versioning, and writing strategies
- **src/types.ts**: TypeScript type definitions
- **dist/**: Compiled and packaged distribution files (generated)
- **lib/**: TypeScript compilation output (generated)
- **changelog/**: Directory containing YAML change files

### Key Concepts

1. **Change Files**: Individual YAML files in `changelog/` directory containing:
   - `significance`: patch, minor, or major
   - `type`: added, changed, deprecated, removed, fixed, security
   - `entry`: Description of the change

2. **Versioning Strategies** (`src/utils/versioning/`):
   - **semver**: Standard semantic versioning
   - **stellarwp**: StellarWP versioning with hotfix support (major.minor.patch[.hotfix])

3. **Writing Strategies** (`src/utils/writing/`):
   - **keepachangelog**: Keep a Changelog format
   - **stellarwp-changelog**: WordPress-style changelog
   - **stellarwp-readme**: WordPress plugin readme format

4. **Configuration**: Managed through `changelogger` section in package.json

## Testing

Tests use Jest with TypeScript (ts-jest) and are located in `__tests__/`. Test configuration uses `tsconfig.test.json`.

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## GitHub Action Usage

The project is itself a GitHub Action (defined in `action.yml`) that can be used in workflows:

```yaml
- uses: stellarwp/changelogger@main
  with:
    command: validate # or 'add', 'write'
```

## Build Process

1. **TypeScript Compilation**: `src/` → `lib/` (CommonJS modules)
2. **Packaging**: Uses @vercel/ncc to create self-contained bundles:
   - CLI/Library: `ncc build lib/main.js` → `dist/index.js`
   - GitHub Action: `ncc build src/github.ts` → `dist/gha/index.js`
3. **Important**: Always run `npm run build` before committing to ensure dist files are updated

## Versioning System Architecture

### How Versioning Strategies Work

- The `write` command loads the versioning strategy from `package.json` config
- Config loading: `loadConfig()` automatically reads `package.json` from current directory
- Strategy loading: `loadVersioningStrategy(config.versioning)` loads the appropriate strategy
- Version extraction: `getCurrentVersion()` validates extracted versions with regex `/^\d+\.\d+\.\d+(?:\.\d+)?$/`

### StellarWP Versioning

- Supports 3-part versions: `1.2.3`
- Supports 4-part versions with hotfix: `1.2.3.4`
- Version incrementing logic:
  - `major`: Resets all lower parts (1.2.3.4 → 2.0.0)
  - `minor`: Resets patch/hotfix (1.2.3.4 → 1.3.0)
  - `patch`: Increments hotfix if present (1.2.3.4 → 1.2.3.5), otherwise patch (1.2.3 → 1.2.4)

## Testing Considerations

### TypeScript Strict Mode

- Tests inherit `noUncheckedIndexedAccess: true` from main tsconfig
- Array/object access in tests requires optional chaining: `mockCall?.[0]` instead of `mockCall[0]`
- This prevents "Object is possibly 'undefined'" errors

### Test File Patterns

```typescript
// Correct pattern for accessing mock calls
const writeCall = mockedFs.writeFile.mock.calls[0];
const writtenContent = writeCall?.[1] as string; // Use optional chaining

// For assertions with potentially undefined values
expect(writeCall?.[0]?.toString()).toContain("expected");
```

### Running Tests

```bash
# Run specific test file
npm test __tests__/commands/write.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should handle invalid version"

# Debug test failures
npm test 2>&1 | grep -E "(✓|✕)" | head -20
```

## Important Notes

- The project uses Node.js 18+ and npm 9+
- Strict TypeScript configuration with `noImplicitAny` and `noUncheckedIndexedAccess`
- ESLint with TypeScript parser and Prettier for code formatting
- The `changelog/` directory contains active change files for this project
- The `debug/` directory contains test output files for changelog writing
- Custom versioning and writing strategies can be loaded from JavaScript files
- The CLI uses `dist/src/cli.js` but the actual bundled code is in `dist/index.js`
