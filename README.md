# @stellarwp/changelogger

A TypeScript-based changelog management tool that works both as a GitHub Action and CLI tool. This is inspired by the [Jetpack Changelogger](https://github.com/Automattic/jetpack-changelogger) but implemented in TypeScript and designed to work seamlessly with GitHub Actions.

## Features

- Manage changelog entries through individual change files
- Interactive CLI for adding changelog entries
- GitHub Action support for CI/CD integration
- Configurable through package.json
- Supports semantic versioning
- Validates change files format and content
- Automatically generates well-formatted changelog entries

## Installation

```bash
npm install @stellarwp/changelogger
```

## Usage

### As a CLI Tool

```bash
# Add a new changelog entry
npm run changelog add

# Validate all change files
npm run changelog validate

# Write changes to CHANGELOG.md
npm run changelog write
```

### CLI Commands Reference

#### `add` Command

Adds a new changelog entry to the project. Can be used in interactive or non-interactive mode.

```bash
# Interactive mode - prompts for all required information
npm run changelog add

# Non-interactive mode - provide all options directly
npm run changelog add -- --significance minor --type feature --entry "Added new feature X"

# Non-interactive mode with auto-generated filename
npm run changelog add -- --significance minor --type feature --entry "Added new feature X" --auto-filename
```

Options:

- `--significance`: The significance of the change (patch, minor, major)
- `--type`: The type of change (e.g., feature, fix, enhancement)
- `--entry`: The changelog entry text
- `--filename`: The desired filename for the changelog entry (optional)
- `--auto-filename`: Automatically generate the filename based on branch name or timestamp (optional)

The command will:

- Create a new YAML file in the configured changes directory
- Generate a filename based on the branch name or timestamp
- Handle duplicate filenames by appending a timestamp
- Validate all inputs before creating the file

When using `--auto-filename`:
- The filename will be automatically generated from the current git branch name (if available)
- If no branch name is available, a timestamp-based filename will be used
- The filename prompt will be skipped

#### `validate` Command

Validates all changelog entries in the changes directory.

```bash
npm run changelog validate
```

This command performs the following checks:

- Validates YAML format of all change files
- Ensures required fields are present
- Verifies significance values (patch, minor, or major)
- Validates type values against configuration
- Ensures non-patch changes have an entry description

#### `write` Command

Writes changelog entries to the configured files.

```bash
# Automatic versioning
npm run changelog write

# Manual versioning
npm run changelog write -- --overwrite-version 1.2.3

# Dry run - show what would be written without making changes
npm run changelog write -- --dry-run
```

Options:

- `--overwrite-version`: Optional version number to use instead of auto-determining
- `--dry-run`: If true, only show what would be written without making changes

The command will:

- Read all YAML change files from the changes directory
- Determine the next version number based on change significance (if not specified)
- Write the changes to each configured file using its specific writing strategy
- Clean up processed change files

When using `--dry-run`:
- Shows what would be written to each configured file
- Displays the formatted changelog entries
- No changes are actually made to any files

When using `--overwrite-version`:
- Uses the specified version instead of auto-determining
- If the version exists in the changelog, new changes are appended to that version
- If the version doesn't exist, a new version entry is created

The command supports multiple output files with different writing strategies:
- Keep a Changelog format
- StellarWP changelog format
- StellarWP readme format
- Custom writing strategies

Each file is processed according to its configured strategy and the changes are written in the appropriate format.

### As a GitHub Action

```yaml
name: Update Changelog

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: stellarwp/changelogger@v1
        with:
          command: validate
          github-token: ${{ secrets.GITHUB_TOKEN }}

  write:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request' && github.event.action == 'closed' && github.event.pull_request.merged == true
    steps:
      - uses: actions/checkout@v4
      - uses: stellarwp/changelogger@v1
        with:
          command: write
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

## Configuration

Configure the changelogger through your package.json:

```json
{
  "changelogger": {
    "changelogFile": "CHANGELOG.md",
    "changesDir": "changelog",
    "linkTemplate": "https://github.com/owner/repo/compare/${old}...${new}",
    "ordering": ["type", "content"],
    "types": {
      "added": "Added",
      "changed": "Changed",
      "deprecated": "Deprecated",
      "removed": "Removed",
      "fixed": "Fixed",
      "security": "Security"
    },
    "versioning": "semver",
    "files": [
      {
        "path": "CHANGELOG.md",
        "strategy": "keepachangelog"
      },
      {
        "path": "readme.txt",
        "strategy": "stellarwp-readme"
      }
    ]
  }
}
```

### Versioning Strategies

The changelogger supports multiple versioning strategies:

1. **semver** (default): Standard semantic versioning (major.minor.patch)

   ```json
   {
     "changelogger": {
       "versioning": "semver"
     }
   }
   ```

2. **stellarwp**: StellarWP versioning with hotfix support (major.minor.patch[.hotfix])

   - Supports 3-part versions: `1.2.3`
   - Supports 4-part versions with hotfix: `1.2.3.4`
   - Hotfix number only appears when greater than 0
   - Version handling:
     - `major`: Increments major, resets others (1.2.3.4 → 2.0.0)
     - `minor`: Increments minor, resets patch/hotfix (1.2.3.4 → 1.3.0)
     - `patch`:
       - With hotfix: Increments hotfix (1.2.3.4 → 1.2.3.5)
       - Without hotfix: Increments patch (1.2.3 → 1.2.4)

   ```json
   {
     "changelogger": {
       "versioning": "stellarwp"
     }
   }
   ```

3. **Custom Versioning**: You can provide a path to a JavaScript file that implements the versioning strategy:

   ```json
   {
     "changelogger": {
       "versioning": "./path/to/custom-versioning.js"
     }
   }
   ```

   The custom versioning file must export these functions:

   ```typescript
   export function getNextVersion(
     currentVersion: string,
     significance: "major" | "minor" | "patch",
   ): string;
   export function isValidVersion(version: string): boolean;
   export function compareVersions(v1: string, v2: string): number;
   ```

### Writing Strategies

The changelogger supports multiple writing strategies that can be configured per file in your package.json:

```json
{
  "changelogger": {
    "files": [
      {
        "path": "CHANGELOG.md",
        "strategy": "keepachangelog"
      },
      {
        "path": "readme.txt",
        "strategy": "stellarwp-readme"
      }
    ]
  }
}
```

Available built-in strategies:

1. **keepachangelog**: Follows the [Keep a Changelog](https://keepachangelog.com/) format

   Example output:

   ```markdown
   ## [1.2.3] - 2024-03-22

   ### Added

   - New feature description

   ### Fixed

   - Bug fix description

   [1.2.3]: https://github.com/owner/repo/compare/1.2.2...1.2.3
   ```

2. **stellarwp-changelog**: A WordPress-style changelog format

   Example output:

   ```markdown
   ### [1.2.3] 2024-03-22

   - Feature - Added new feature
   - Fix - Fixed a bug
   ```

3. **stellarwp-readme**: Updates readme.txt in WordPress plugin format

   Example output:

   ```text
   == Changelog ==

   = [1.2.3] 2024-03-22 =

   * Feature - Added new feature
   * Fix - Fixed a bug
   ```

4. **Custom Writing**: You can provide a path to a JavaScript file that implements the writing strategy:

   ```json
   {
     "changelogger": {
       "files": [
         {
           "path": "CHANGELOG.md",
           "strategy": "./path/to/custom-writing.js"
         }
       ]
     }
   }
   ```

   The custom writing file must implement the WritingStrategy interface:

   ```typescript
   interface WritingStrategy {
     /**
      * Format the changes into a changelog entry
      */
     formatChanges(
       version: string,
       changes: Array<{ type: string; entry: string }>,
       previousVersion?: string,
     ): string;

     /**
      * Format the header for a new version
      */
     formatVersionHeader(
       version: string,
       date: string,
       previousVersion?: string,
     ): string;

     /**
      * Optional: Format version comparison links
      */
     formatVersionLink?(
       version: string,
       previousVersion: string,
       template?: string,
     ): string;

     /**
      * Optional: Handle additional files that need to be updated
      * with the changelog (e.g., readme.txt, package.json)
      */
     handleAdditionalFiles?(
       version: string,
       date: string,
       changes: Array<{ type: string; entry: string }>,
       config: {
         changelogFile: string;
         changesDir: string;
         types: Record<string, string>;
         [key: string]: any;
       },
     ): Promise<void>[];
   }
   ```

   Example custom writing strategy:

   ```typescript
   // custom-writing.ts
   import * as fs from "fs/promises";
   import * as path from "path";
   import { WritingStrategy } from "@stellarwp/changelogger";

   const customStrategy: WritingStrategy = {
     formatChanges(version, changes) {
       return changes
         .map((change) => `- [${change.type.toUpperCase()}] ${change.entry}`)
         .join("\n");
     },

     formatVersionHeader(version, date) {
       return `# Version ${version} (${date})`;
     },

     formatVersionLink(version, previousVersion, template) {
       if (!template) return "";
       return `Compare: ${template
         .replace("${old}", previousVersion)
         .replace("${new}", version)}`;
     },

     handleAdditionalFiles(version, date, changes, config) {
       const promises: Promise<void>[] = [];

       // Example: Update package.json version
       promises.push(
         (async () => {
           try {
             const pkgPath = path.join(process.cwd(), "package.json");
             const pkg = JSON.parse(await fs.readFile(pkgPath, "utf8"));
             pkg.version = version;
             await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2));
           } catch (error) {
             if ((error as { code: string }).code !== "ENOENT") {
               throw error;
             }
           }
         })(),
       );

       return promises;
     },
   };

   export default customStrategy;
   ```

   Example output:

   ```markdown
   # Version 1.2.3 (2024-03-22)

   - [ADDED] New feature description
   - [FIXED] Bug fix description
     Compare: https://github.com/owner/repo/compare/1.2.2...1.2.3
   ```

### Change File Handling

When adding new changelog entries:

1. **Default Filename**: By default, uses the current git branch name (cleaned up) or a timestamp if no branch name is available.

2. **File Naming Rules**:

   - Converts to lowercase
   - Replaces non-alphanumeric characters with hyphens
   - Removes leading/trailing hyphens
   - Collapses multiple hyphens into one
     Example: `Feature/Add-NEW_thing!!!` → `feature-add-new-thing.yaml`

3. **Duplicate Handling**: If a file with the same name exists:

   - Adds a timestamp to the filename
   - Example: If `feature.yaml` exists, creates `feature-1234567890.yaml`

4. **Interactive Prompts**:

   - Significance: patch, minor, or major
   - Type: added, changed, deprecated, removed, fixed, or security
   - Entry: Description of the change
   - Filename: Optional custom filename

5. **Directory Structure**:
   - Creates the changes directory if it doesn't exist
   - Stores all change files in the configured directory (default: `changelog/`)

## Change File Format

Change files are YAML files containing:

```yaml
significance: patch|minor|major
type: added|changed|deprecated|removed|fixed|security
entry: Description of the change
```

## License

MIT
