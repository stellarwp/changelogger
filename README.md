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
    "formatter": "keepachangelog",
    "versioning": "semver"
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

The changelogger supports multiple writing strategies for formatting the changelog:

1. **keepachangelog** (default): Follows the [Keep a Changelog](https://keepachangelog.com/) format

   ```json
   {
     "changelogger": {
       "formatter": "keepachangelog"
     }
   }
   ```

   Example output:

   ```markdown
   ## [1.2.3] - 2024-03-22

   ### Added

   - New feature description

   ### Fixed

   - Bug fix description

   [1.2.3]: https://github.com/owner/repo/compare/1.2.2...1.2.3
   ```

2. **stellarwp**: A WordPress-style changelog format that also updates readme.txt

   ```json
   {
     "changelogger": {
       "formatter": "stellarwp"
     }
   }
   ```

   Example output in changelog.md:

   ```markdown
   ### [1.2.3] 2024-03-22

   * Feature - Added new feature
   * Fix - Fixed a bug
   ```

   And automatically updates readme.txt if present:
   ```text
   == Changelog ==

   = [1.2.3] 2024-03-22 =

   * Feature - Added new feature
   * Fix - Fixed a bug
   ```

3. **Custom Writing**: You can provide a path to a JavaScript file that implements the writing strategy:

   ```json
   {
     "changelogger": {
       "formatter": "./path/to/custom-writing.js"
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
