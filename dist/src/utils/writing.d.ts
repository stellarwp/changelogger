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
}
export declare function loadWritingStrategy(formatter: string): Promise<WritingStrategy>;
