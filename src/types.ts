export type Significance = "patch" | "minor" | "major";

export type ChangeType = "deprecated" | "removed" | "security" | "feature" | "tweak" | "fix" | "compatibility" | "language";

export interface ChangeFile {
  significance: Significance;
  type: ChangeType;
  entry: string;
  timestamp?: string;
}

export interface AddCommandOptions {
  significance?: string;
  type?: string;
  entry?: string;
  filename?: string;
  autoFilename?: boolean;
}

/**
 * Options for the write command.
 */
export interface WriteCommandOptions {
  /**
   * Optional version number to use instead of auto-determining.
   * If not provided, the next version will be determined based on change significance.
   */
  overwriteVersion?: string;

  /**
   * If true, only show what would be written without making changes.
   * This is useful for previewing changes before applying them.
   */
  dryRun?: boolean;

  /**
   * Optional date to use for the changelog entry.
   * If not provided, the current date will be used.
   * The date should be in a format that PHP's strtotime() function can parse.
   * Examples:
   * - "2024-03-20"
   * - "yesterday"
   * - "last monday"
   * - "2 days ago"
   */
  date?: string;
}

export interface Config {
  changelogFile: string;
  readmeFile?: string;
  changesDir: string;
  linkTemplate?: string;
  ordering: ("type" | "significance" | "timestamp" | "content")[];
  types: Record<ChangeType, string>;
  typeLabelOverrides: Record<string, Partial<Record<ChangeType, string>>>;
  formatter: string;
  /**
   * The versioning strategy to use.
   * Can be:
   * - "semver" for semantic versioning (major.minor.patch)
   * - "stellarwp" for StellarWP versioning (major.minor.patch.hotfix)
   * - A path to a JavaScript file that exports the versioning methods
   */
  versioning: string;
  /**
   * Array of files to update with their individual writing strategies
   */
  files: Array<{
    path: string;
    strategy: string;
  }>;
}
