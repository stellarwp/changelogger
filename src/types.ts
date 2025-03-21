export type Significance = "patch" | "minor" | "major";

export type ChangeType =
  | "added"
  | "changed"
  | "deprecated"
  | "removed"
  | "fixed"
  | "security"
  | "feature"
  | "tweak"
  | "fix"
  | "compatibility"
  | "language";

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
  githubToken?: string;
  filename?: string;
}

export interface WriteCommandOptions {
  version?: string;
  githubToken?: string;
}

export interface Config {
  changelogFile: string;
  changesDir: string;
  linkTemplate?: string;
  ordering: ("type" | "significance" | "timestamp" | "content")[];
  types: Record<ChangeType, string>;
  formatter: string;
  /**
   * The versioning strategy to use.
   * Can be:
   * - "semver" for semantic versioning (major.minor.patch)
   * - "stellarwp" for StellarWP versioning (major.minor.patch.hotfix)
   * - A path to a JavaScript file that exports the versioning methods
   */
  versioning: string;
}
