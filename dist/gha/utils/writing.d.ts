import { ChangeFile } from "../types";
export interface WritingStrategy {
    /**
     * Format the changes into a changelog entry
     */
    formatChanges: (version: string, changes: ChangeFile[], previousVersion?: string) => string;
    /**
     * Format the header for a new version
     */
    formatVersionHeader: (version: string, date: string, previousVersion?: string) => string;
    /**
     * Format the link to compare versions (if supported)
     */
    formatVersionLink?: (version: string, previousVersion: string, template?: string) => string;
    /**
     * Match an existing version header in the changelog
     * Returns the matched version if found, undefined if not
     */
    versionHeaderMatcher: (content: string, version: string) => string | undefined;
    /**
     * Match where to insert new changelog entries
     * Returns the index where new entries should be inserted
     */
    changelogHeaderMatcher: (content: string) => number;
}
export declare function loadWritingStrategy(formatter: string): Promise<WritingStrategy>;
//# sourceMappingURL=writing.d.ts.map