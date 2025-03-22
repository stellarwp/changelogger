export type Significance = "patch" | "minor" | "major";
export type ChangeType = "added" | "changed" | "deprecated" | "removed" | "fixed" | "security" | "feature" | "tweak" | "fix" | "compatibility" | "language";
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
}
export interface WriteCommandOptions {
    overwriteVersion?: string;
    /**
     * If true, only show what would be written without making changes
     * @default false
     */
    dryRun?: boolean;
    rotateVersions?: number;
}
export interface Config {
    changelogFile: string;
    readmeFile?: string;
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
    /**
     * Array of files to update with their individual writing strategies
     */
    files: Array<{
        path: string;
        strategy: string;
    }>;
}
