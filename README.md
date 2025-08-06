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

### As a Module

```typescript
import {
  addCommand,
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
const customWritingStrategy = await loadWritingStrategy("./path/to/custom-writing.ts");
const customVersioningStrategy = await loadVersioningStrategy("./path/to/custom-versioning.ts");
```

### As a GitHub Action

```yaml
name: Verify changelog Entry.

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: stellarwp/changelogger@main
        with:
          command: validate
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

## Programmatic Usage

The changelogger can also be used as a library in your Node.js applications:

### Basic Usage

#### TypeScript / ES6 Modules (with bundler)

```typescript
import { loadConfig, addCommand, validateCommand, writeCommand, Config, WritingStrategy, VersioningStrategy } from "@stellarwp/changelogger";

// Load configuration from package.json
const config = await loadConfig();

// Add a new change entry programmatically
await addCommand({
  significance: "minor",
  type: "added",
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
```

#### CommonJS

```javascript
const { loadConfig, addCommand, validateCommand, writeCommand } = require("@stellarwp/changelogger");

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
console.log(getTypeLabel("added")); // "Added"
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

// Load custom strategies from files
const customVersioning = await loadVersioningStrategy("./my-versioning.js");
const customWriting = await loadWritingStrategy("./my-writing.js");

// Use strategies directly
const nextVersion = customVersioning.getNextVersion("1.2.3", "minor");
console.log(nextVersion); // Your custom versioning logic result
```

### TypeScript Support

The package includes TypeScript declarations for full type support:

```typescript
import { Config, ChangeFile, WriteCommandOptions, VersioningStrategy, WritingStrategy } from "@stellarwp/changelogger";

// All types are available for TypeScript users
const config: Config = await loadConfig();

const change: ChangeFile = {
  significance: "patch",
  type: "fixed",
  entry: "Fixed a bug",
};

const options: WriteCommandOptions = {
  overwriteVersion: "1.0.0",
  dryRun: true,
};
```

## License

MIT
