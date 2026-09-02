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
- Multiple writing strategies (Keep a Changelog, StellarWP formats)
- Multiple versioning strategies (SemVer, StellarWP)

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

# Get changelog contents for a specific version
npm run changelog get-changelog-contents -- --version 1.2.3
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

# Specify a custom date (supports PHP strtotime format)
npm run changelog write -- --date "2024-03-20"
npm run changelog write -- --date "yesterday"
npm run changelog write -- --date "last monday"
```

Options:

- `--overwrite-version`: Optional version number to use instead of auto-determining
- `--dry-run`: If true, only show what would be written without making changes
- `--date`: Custom date to use for the changelog entry (supports PHP strtotime format)

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

When using `--date`:

- Uses the specified date for the changelog entry
- Supports PHP strtotime format for flexible date specification
- Examples:
  - `--date "2024-03-20"` - Specific date
  - `--date "yesterday"` - Relative date
  - `--date "last monday"` - Relative date
  - `--date "next friday"` - Relative date
- If not specified, uses the current date

The command supports multiple output files with different writing strategies:

- Keep a Changelog format
- StellarWP changelog format
- StellarWP readme format
- Custom writing strategies

Each file is processed according to its configured strategy and the changes are written in the appropriate format.

#### `get-changelog-contents` Command

Retrieves the already-written changelog entries for a specific version from a changelog file. This is useful in automation workflows where you need the formatted changelog contents (e.g., for release notes, Slack notifications, or GitHub release bodies).

```bash
# Get the markdown entries for a specific version
npm run changelog get-changelog-contents -- --version 1.2.3

# Get entries for the most recent version
npm run changelog get-changelog-contents -- --last

# Get entries from a specific configured file
npm run changelog get-changelog-contents -- --version 1.2.3 --file readme.txt

# Get entries converted to HTML
npm run changelog get-changelog-contents -- --version 1.2.3 --html
```

Options:

- `--version`: The version to retrieve changelog contents for. Required unless `--last` is used.
- `--last`: Retrieve changelog contents for the most recent version in the file. Cannot be used with `--version`.
- `--file`: Path to a specific configured changelog file (must match a path in the `files` config array). Defaults to the first configured file.
- `--html`: Convert the Markdown changelog contents to HTML

The command will:

- Read the specified (or first configured) changelog file
- Use the file's writing strategy to locate the version header and boundaries
- Extract the entries for that version (without the version header line)
- Optionally convert the Markdown entries to HTML when `--html` is specified

> [!NOTE]
> Version boundaries are detected using the configured writing strategy's header matcher. If your changelog file contains non-version content (e.g., headings or text) after the last version entry, that content may be included in the output for that version since there is no subsequent version header to mark the boundary. To avoid this, ensure that there is nothing after the last changelog entry in your file.

### As a Module

```typescript
import {
  addCommand,
  getChangelogContentsCommand,
  validateCommand,
  writeCommand,
  writingStrategies,
  versioningStrategies,
  loadConfig,
  loadWritingStrategy,
  loadVersioningStrategy,
  WritingStrategy,
  VersioningStrategy,
} from "@stellarwp/changelogger";

// Use built-in writing strategies
const keepachangelog = writingStrategies.keepachangelog;
const stellarwpChangelog = writingStrategies.stellarwpChangelog;
const stellarwpReadme = writingStrategies.stellarwpReadme;

// Use built-in versioning strategies
const semver = versioningStrategies.semverStrategy;
const stellarwp = versioningStrategies.stellarStrategy;

// Load custom strategies
// Note: Custom strategy files must be compiled JavaScript (.js) files.
// TypeScript (.ts) files are not supported and must be compiled first.
const customWritingStrategy = await loadWritingStrategy("./path/to/custom-writing.js");
const customVersioningStrategy = await loadVersioningStrategy("./path/to/custom-versioning.js");
```

### As a GitHub Action

The changelogger can be used directly in GitHub Actions workflows. All four commands (`add`, `validate`, `write`, `get-changelog-contents`) are supported.

#### Inputs

| Input          | Required | Description                                                              | Used By                              |
| -------------- | -------- | ------------------------------------------------------------------------ | ------------------------------------ |
| `command`      | Yes      | The command to run: `add`, `validate`, `write`, `get-changelog-contents` | All                                  |
| `significance` | No       | Significance of the change: `patch`, `minor`, `major`                    | `add`                                |
| `type`         | No       | Type of change (e.g., `feature`, `fix`, `tweak`)                         | `add`                                |
| `entry`        | No       | The changelog entry text                                                 | `add`                                |
| `filename`     | No       | Custom filename for the changelog entry                                  | `add`                                |
| `version`      | No       | Version number for writing or retrieving changelog contents              | `write`, `get-changelog-contents`    |
| `date`         | No       | Date for the changelog entry (PHP strtotime format)                      | `write`                              |
| `file`         | No       | Specific file to validate or read from                                   | `validate`, `get-changelog-contents` |
| `from`         | No       | Git ref to compare from                                                  | `validate`                           |
| `to`           | No       | Git ref to compare to                                                    | `validate`                           |
| `html`         | No       | Convert output to HTML (default: `false`)                                | `get-changelog-contents`             |

#### Outputs

| Output      | Description                                                           |
| ----------- | --------------------------------------------------------------------- |
| `result`    | The result of the command execution: `success` or `error`             |
| `filename`  | The file path of the created change file (only set by `add` command)  |
| `changelog` | The changelog contents (only set by `get-changelog-contents` command) |

#### Permissions

This action does not call the GitHub API and never reads `GITHUB_TOKEN`. It reads and writes change files in the workspace and runs `git` locally for the `from`/`to` comparison, so it needs no token permissions of its own — only the `contents: read` that `actions/checkout` requires.

Declare a `permissions:` block in your workflow instead of relying on the default. Organizations and enterprises set the default `GITHUB_TOKEN` permissions for their repositories, and that default is read-only for enterprises and organizations created on or after 2 February 2023. A workflow with no `permissions:` block receives whatever the current default is, so an administrator changing that setting can break a workflow that nobody edited. The setting controls the default only: a workflow that declares a `permissions:` block gets what it asks for, including scopes the default does not grant.

| What your workflow does                                            | Permissions                               |
| ------------------------------------------------------------------ | ----------------------------------------- |
| `validate` or `get-changelog-contents`                             | `contents: read`                          |
| `add` or `write`, with no commit, push, or pull request afterwards | `contents: read`                          |
| `add` or `write`, then committing the result to a branch           | `contents: write`                         |
| `add` or `write`, then opening a pull request                      | `contents: write`, `pull-requests: write` |
| Passing `get-changelog-contents` output to a release step          | `contents: write`                         |

`add` and `write` change files on the runner only. Those edits are discarded when the job ends unless a later step commits or pushes them, and it is that step, not this action, that requires `contents: write`. The same applies to opening a pull request and to creating a release: the permission belongs to the step that performs the operation.

Two limits apply no matter what the `permissions:` block requests:

- **Pull requests from forks.** The `GITHUB_TOKEN` is read-only for a `pull_request` event raised from a fork, unless an administrator has enabled "Send write tokens to workflows from pull requests".
- **Opening pull requests.** "Allow GitHub Actions to create and approve pull requests" must be enabled under Settings > Actions > General before any step can open a pull request, even when the job already has `pull-requests: write`.

On GitHub Enterprise Server, an action hosted on github.com resolves only when GitHub Connect is enabled. Without it, mirror this repository onto your instance and reference the mirrored copy in place of `stellarwp/changelogger@v0`.

#### Validate Changelog Entries on Pull Requests

Validate that changelog entries were added and are properly formatted. Use `from` and `to` to check only the files changed in the PR:

```yaml
name: Validate Changelog Entry

on:
  pull_request:
    types: [opened, synchronize]

permissions:
  contents: read

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: stellarwp/changelogger@v0
        with:
          command: validate
          from: ${{ github.event.pull_request.base.sha }}
          to: ${{ github.event.pull_request.head.sha }}
```

`fetch-depth: 0` is required so that the `from` and `to` refs are present in the checkout.

Without `from`/`to`, all files in the changes directory are validated:

```yaml
- uses: stellarwp/changelogger@v0
  with:
    command: validate
```

To validate a specific file:

```yaml
- uses: stellarwp/changelogger@v0
  with:
    command: validate
    file: changelog/my-change.yaml
```

#### Add a Changelog Entry

Add a new changelog entry. When `filename` is not provided, the filename is auto-generated:

```yaml
- uses: stellarwp/changelogger@v0
  with:
    command: add
    significance: minor
    type: feature
    entry: "Added new dashboard widget"
```

With a custom filename:

```yaml
- uses: stellarwp/changelogger@v0
  with:
    command: add
    significance: patch
    type: fix
    entry: "Fixed login redirect issue"
    filename: fix-login-redirect
```

#### Write Changelog

Write pending changelog entries to the configured files:

```yaml
- uses: stellarwp/changelogger@v0
  with:
    command: write
    version: "1.2.0"
    date: "2024-03-20"
```

#### Get Changelog Contents

Retrieve the already-written changelog entries for a version. This is useful for creating GitHub Releases, Slack notifications, or other automation:

```yaml
- name: Get changelog
  id: changelog
  uses: stellarwp/changelogger@v0
  with:
    command: get-changelog-contents
    version: "1.2.0"

- name: Create GitHub Release
  uses: softprops/action-gh-release@v2
  with:
    body: ${{ steps.changelog.outputs.changelog }}
```

The release step needs `contents: write` on the job. See [Permissions](#permissions).

To get HTML output instead of Markdown:

```yaml
- name: Get changelog as HTML
  id: changelog
  uses: stellarwp/changelogger@v0
  with:
    command: get-changelog-contents
    version: "1.2.0"
    html: "true"
```

To read from a specific configured file:

```yaml
- uses: stellarwp/changelogger@v0
  with:
    command: get-changelog-contents
    version: "1.2.0"
    file: readme.txt
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
      "deprecated": "Deprecated",
      "feature": "Feature",
      "fix": "Fix",
      "removed": "Removed",
      "security": "Security"
      "tweak": "Tweak",
    },
    "versioning": "semver",
    "files": [
      {
        "path": "CHANGELOG.md",
        "strategy": "keepachangelog"
      },
      {
        "ordering": ["significance", "content"],
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

   > [!IMPORTANT]
   > Custom strategy files must be JavaScript (`.js`) files. TypeScript (`.ts`) files are not supported at runtime and must be compiled to JavaScript first. This applies both when using the CLI and programmatically because strategy files are loaded dynamically using Node's `import()`, which requires JavaScript files. If you write your custom versioning strategy in TypeScript, compile it to CommonJS JavaScript first. Use the below example and then update your configuration to use the compiled `.js` file.

   ```bash
   tsc path/to/your/custom-versioning.ts --outDir path/to/your --module CommonJS --target ES2020 --esModuleInterop false --allowSyntheticDefaultImports false --declaration false --sourceMap false --strict --skipLibCheck
   ```

   The custom versioning file must export an object with these methods:

   ```javascript
   // custom-versioning.js
   module.exports = {
     /**
      * Calculate the next version based on current version and significance
      * @param {string} currentVersion - Current version string
      * @param {"major" | "minor" | "patch"} significance - Type of change
      * @returns {string} The next version
      */
     getNextVersion(currentVersion, significance) {
       // Your custom logic here
       const parts = currentVersion.split(".");
       const major = parseInt(parts[0] || "0");
       const minor = parseInt(parts[1] || "0");
       const patch = parseInt(parts[2] || "0");

       switch (significance) {
         case "major":
           return `${major + 1}.0.0`;
         case "minor":
           return `${major}.${minor + 1}.0`;
         case "patch":
           return `${major}.${minor}.${patch + 1}`;
         default:
           throw new Error(`Unknown significance: ${significance}`);
       }
     },

     /**
      * Check if a version string is valid
      * @param {string} version - Version string to validate
      * @returns {boolean} True if valid
      */
     isValidVersion(version) {
       return /^\d+\.\d+\.\d+$/.test(version);
     },

     /**
      * Compare two versions
      * @param {string} v1 - First version
      * @param {string} v2 - Second version
      * @returns {number} -1 if v1 < v2, 0 if equal, 1 if v1 > v2
      */
     compareVersions(v1, v2) {
       const parts1 = v1.split(".").map(Number);
       const parts2 = v2.split(".").map(Number);

       for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
         const part1 = parts1[i] || 0;
         const part2 = parts2[i] || 0;

         if (part1 < part2) return -1;
         if (part1 > part2) return 1;
       }

       return 0;
     },
   };
   ```

   See [examples/custom-versioning.js](examples/custom-versioning.js) for a complete example.

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

   > [!IMPORTANT]
   > Custom strategy files must be compiled JavaScript (`.js`) files. TypeScript (`.ts`) files are not supported at runtime and must be compiled to JavaScript first. This applies both when using the CLI and programmatically because strategy files are loaded dynamically using Node's `import()`, which requires JavaScript files. If you write your custom writing strategy in TypeScript, compile it to CommonJS JavaScript first. Use the below example and then update your configuration to use the compiled `.js` file.

   ```bash
   tsc path/to/your/custom-writing.ts --outDir path/to/your/ --module CommonJS --target ES2020 --esModuleInterop false --allowSyntheticDefaultImports false --declaration false --sourceMap false --strict --skipLibCheck
   ```

   The custom writing file must export an object with these methods:

   ```javascript
   // custom-writing.js

   // You can import utilities from the main package to help with formatting
   // Note: These are only available when using the writing strategy through changelogger
   const { getTypeLabel, defaultConfig } = require("@stellarwp/changelogger");

   module.exports = {
     /**
      * Format the changes into a changelog entry
      * @param {string} version - Version being released
      * @param {Array<{type: string, entry: string, significance: string}>} changes - List of changes
      * @param {string} [previousVersion] - Previous version for comparison
      * @returns {string} Formatted changelog content
      */
     formatChanges(version, changes, previousVersion) {
       // Group changes by type
       const grouped = {};
       for (const change of changes) {
         if (!grouped[change.type]) {
           grouped[change.type] = [];
         }
         grouped[change.type].push(change.entry);
       }

       // Format each group
       let output = "";
       for (const [type, entries] of Object.entries(grouped)) {
         // Use getTypeLabel for consistent type formatting
         // Falls back to capitalized type if not in config
         const label = getTypeLabel ? getTypeLabel(type) : type.charAt(0).toUpperCase() + type.slice(1);
         output += `\n### ${label}\n\n`;
         for (const entry of entries) {
           output += `- ${entry}\n`;
         }
       }

       return output;
     },

     /**
      * Format the header for a new version
      * @param {string} version - Version being released
      * @param {string} date - Release date (YYYY-MM-DD format)
      * @param {string} [previousVersion] - Previous version
      * @returns {string} Formatted version header
      */
     formatVersionHeader(version, date, previousVersion) {
       return `## [${version}] - ${date}\n`;
     },

     /**
      * Optional: Format version comparison links
      * @param {string} version - Current version
      * @param {string} previousVersion - Previous version
      * @param {string} [template] - URL template from config
      * @returns {string} Formatted link
      */
     formatVersionLink(version, previousVersion, template) {
       if (!template) return "";

       const link = template.replace("{version}", version).replace("{previousVersion}", previousVersion);

       return `\n[${version}]: ${link}\n`;
     },

     /**
      * Match an existing version header in the changelog
      * @param {string} content - Existing changelog content
      * @param {string} version - Version to find
      * @returns {string|undefined} Matched header or undefined
      */
     versionHeaderMatcher(content, version) {
       const regex = new RegExp(`^## \\[${version}\\].*$`, "m");
       const match = content.match(regex);
       return match ? match[0] : undefined;
     },

     /**
      * Find where to insert new changelog entries
      * @param {string} content - Existing changelog content
      * @returns {number} Index where new entries should be inserted
      */
     changelogHeaderMatcher(content) {
       // Look for the first version header
       const match = content.match(/^## \[.*?\]/m);
       if (match && match.index !== undefined) {
         return match.index;
       }

       // Look for main changelog header
       const headerMatch = content.match(/^# Changelog/m);
       if (headerMatch && headerMatch.index !== undefined) {
         return headerMatch.index + headerMatch[0].length + 1;
       }

       return 0;
     },
   };
   ```

   See [examples/custom-writing.js](examples/custom-writing.js) for a complete example.

   Example output:

   ```markdown
   # Version 1.2.3 (2024-03-22)

   - [Feature] New feature description
   - [Fix] Bug fix description
     Compare: https://github.com/owner/repo/compare/1.2.2...1.2.3
   ```

### Type Label Overrides per-Writing Strategy

There may be times where you want a specific writing stategy to use different type labels than the global `types` object.

You can do this with the optional `typeLabelOverrides` key in your configuration.

```json
{
  "changelogger": {
    "types": {
      "compatibility": "Compatibility",
      "deprecated": "Deprecated",
      "feature": "Feature",
      "fix": "Fix",
      "language": "Language",
      "removed": "Removed",
      "security": "Security",
      "tweak": "Tweak"
    },
    "typeLabelOverrides": {
      "keepachangelog": {
        "feature": "Added",
        "fix": "Fixed",
        "tweak": "Changed"
      },
      "custom-strategy": {
        "feature": "New Feature",
        "fix": "Bug Fix",
        "tweak": "Updated"
      }
    }
  }
}
```

This is particularly useful if you're outputting your changelog in multiple locations with the `files` key and each is configured to use a different writing strategy.

If you're using a custom writing strategy, you will need to ensure you call `getTypeLabel()` with the `strategy` parameter matching the key you set in this configuration.

### Change item sorting per-changelog location

When multiple changelog locations have been defined with the `files` key, you may find a need to provide a different sort order for each changelog file.

This can be done with the `ordering` key for each file.

If an `ordering` key has not been defined for a file, the global `ordering` key is used.

```json
{
  "changelogger": {
    ...
    "ordering": ["type", "content"],
    ...
    "files": [
      {
        "path": "CHANGELOG.md",
        "strategy": "keepachangelog"
      },
      {
        "ordering": ["significance", "content"],
        "path": "readme.txt",
        "strategy": "stellarwp-readme"
      }
    ]
  }
}
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
   - Type: feature, tweak, deprecated, removed, fix, or security
   - Entry: Description of the change
   - Filename: Optional custom filename

5. **Directory Structure**:
   - Creates the changes directory if it doesn't exist
   - Stores all change files in the configured directory (default: `changelog/`)

## Change File Format

Change files are YAML files containing:

```yaml
significance: patch|minor|major
type: feature|tweak|deprecated|removed|fix|security
entry: Description of the change
```

## Programmatic Usage

The changelogger can also be used as a library in your Node.js applications:

### Basic Usage

#### TypeScript / ES6 Modules (with bundler)

```typescript
import {
  loadConfig,
  addCommand,
  getChangelogContentsCommand,
  validateCommand,
  writeCommand,
  Config,
  WritingStrategy,
  VersioningStrategy,
} from "@stellarwp/changelogger";

// Load configuration from package.json
const config = await loadConfig();

// Add a new change entry programmatically
await addCommand({
  significance: "minor",
  type: "feature",
  entry: "New feature added",
  filename: "custom-change.yaml",
});

// Validate all change files
const validationResult = await validateCommand();
console.log(validationResult);

// Write changelog (with options)
const writeResult = await writeCommand({
  overwriteVersion: "1.2.3",
  dryRun: false,
  date: "2024-03-20",
});
console.log(writeResult);

// Get changelog contents for a version
const markdownContents = await getChangelogContentsCommand({ version: "1.2.3" });
console.log(markdownContents);

// Get changelog contents as HTML
const htmlContents = await getChangelogContentsCommand({ version: "1.2.3", html: true });
console.log(htmlContents);

// Get changelog contents from a specific file
const readmeContents = await getChangelogContentsCommand({ version: "1.2.3", file: "readme.txt" });
console.log(readmeContents);
```

#### CommonJS

```javascript
const { loadConfig, addCommand, getChangelogContentsCommand, validateCommand, writeCommand } = require("@stellarwp/changelogger");

// Same usage as above
(async () => {
  const config = await loadConfig();
  console.log("Config loaded:", config.changelogFile);
})();
```

### Utility Functions

```typescript
// TypeScript / ES6 with bundler
import { defaultConfig, getTypeLabel } from "@stellarwp/changelogger";

// Use default configuration as a base
const myConfig = {
  ...defaultConfig,
  changesDir: "my-changes",
};

// Get formatted labels for change types
console.log(getTypeLabel("feature")); // "Feature"
console.log(getTypeLabel("fix")); // "Fix"
console.log(getTypeLabel("custom-type")); // Falls back to "custom-type" if not defined
```

### Custom Strategies

```typescript
// TypeScript / ES6 with bundler
import { loadVersioningStrategy, loadWritingStrategy, versioningStrategies, writingStrategies, getTypeLabel, defaultConfig } from "@stellarwp/changelogger";

// Load built-in strategies
const semverStrategy = versioningStrategies.semverStrategy;
const keepachangelog = writingStrategies.keepachangelog;

// Load custom strategies from files (must be compiled .js files).
const customVersioning = await loadVersioningStrategy("./my-versioning.js");
const customWriting = await loadWritingStrategy("./my-writing.js");

// Use strategies directly
const nextVersion = customVersioning.getNextVersion("1.2.3", "minor");
console.log(nextVersion); // Your custom versioning logic result
```

### TypeScript Support

The package includes TypeScript declarations for full type support:

```typescript
import { Config, ChangeFile, WriteCommandOptions, GetChangelogContentsOptions, VersioningStrategy, WritingStrategy } from "@stellarwp/changelogger";

// All types are available for TypeScript users
const config: Config = await loadConfig();

const change: ChangeFile = {
  significance: "patch",
  type: "fix",
  entry: "Fixed a bug",
};

const writeOptions: WriteCommandOptions = {
  overwriteVersion: "1.0.0",
  dryRun: true,
};

const getContentsOptions: GetChangelogContentsOptions = {
  version: "1.0.0",
  file: "readme.txt",
  html: true,
};
```

## License

MIT
