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
    command: validate  # or 'add', 'write'
```

## Build Process

1. **TypeScript Compilation**: `src/` → `lib/` (CommonJS modules)
2. **Packaging**: Uses @vercel/ncc to create self-contained bundles:
   - CLI/Library: → `dist/index.js`
   - GitHub Action: → `dist/gha/index.js`

## Important Notes

- The project uses Node.js 18+ and npm 9+
- Strict TypeScript configuration with `noImplicitAny` and `noUncheckedIndexedAccess`
- ESLint with TypeScript parser and Prettier for code formatting
- The `changelog/` directory contains active change files for this project
- The `debug/` directory contains test output files for changelog writing
- Custom versioning and writing strategies can be loaded from JavaScript files
