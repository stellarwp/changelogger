import { Significance } from "../types";
export interface VersioningStrategy {
    /**
     * Get the next version based on the current version and significance
     */
    getNextVersion: (currentVersion: string, significance: Significance) => string;
    /**
     * Validate if a version string is valid
     */
    isValidVersion: (version: string) => boolean;
    /**
     * Compare two versions
     * Returns:
     * - negative if v1 < v2
     * - 0 if v1 === v2
     * - positive if v1 > v2
     */
    compareVersions: (v1: string, v2: string) => number;
}
export declare function loadVersioningStrategy(versioning: string): Promise<VersioningStrategy>;
