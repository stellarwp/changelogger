import { ChangeFile } from "../../types";
import { getTypeLabel } from "../config";
import { WritingStrategy } from "../writing";

const stellarwpChangelog: WritingStrategy = {
  formatChanges(version: string, changes: ChangeFile[], previousVersion?: string): string {
    // Group changes by type
    const groupedChanges = changes.reduce(
      (acc, change) => {
        if (!acc[change.type]) {
          acc[change.type] = [];
        }
        acc[change.type]?.push(change.entry);
        return acc;
      },
      {} as Record<string, string[]>
    );

    // Format each type's changes using the original types from the changes
    const sections = Object.entries(groupedChanges)
      .map(([type, entries]) => {
        // Capitalize the first letter of the type
        const formattedType = getTypeLabel(type);
        return entries.map(entry => `* ${formattedType} - ${entry}`).join("\n");
      })
      .filter(section => section.length > 0);

    return sections.join("\n");
  },

  formatVersionHeader(version: string, date: string, previousVersion?: string): string {
    return `\n### [${version}] ${date}\n\n`;
  },

  formatVersionLink(version: string, previousVersion: string, template?: string): string {
    // StellarWP format doesn't use version links
    return "";
  },

  versionHeaderMatcher(content: string, version: string): string | undefined {
    // Match StellarWP version headers
    const versionRegex = new RegExp(`^(### \\[${version}\\] (?:[^=]+))$`, "m");
    const match = content.match(versionRegex);
    return match ? match[1]?.trim() : undefined;
  },

  changelogHeaderMatcher(content: string): number {
    // Find the position after the first version header
    const firstVersionMatch = content.match(/^### \[[^\]]+\] [^=]+$/m);
    if (!firstVersionMatch) {
      // If no version header found, find the position after the main header
      const mainHeaderMatch = content.match(/^== Changelog ==$/m);
      return mainHeaderMatch ? mainHeaderMatch.index! + mainHeaderMatch[0].length + 1 : 0;
    }
    return firstVersionMatch.index!;
  },
};

export default stellarwpChangelog;
