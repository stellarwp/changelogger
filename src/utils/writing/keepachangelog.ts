import { ChangeFile } from "../../types";
import { getTypeLabel } from "../config";
import { WritingStrategy } from "../writing";

const keepachangelog: WritingStrategy = {
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

    // Format each type's changes
    const sections = Object.entries(groupedChanges).map(([type, entries]) => {
      const title = getTypeLabel(type, "keepachangelog");
      const items = entries.map(entry => `- ${entry}`).join("\n");
      return `### ${title}\n${items}`;
    });

    return sections.join("\n\n");
  },

  formatVersionHeader(version: string, date: string, previousVersion?: string): string {
    return `## [${version}] - ${date}`;
  },

  formatVersionLink(version: string, previousVersion: string, template?: string): string {
    if (!template) {
      return "";
    }

    const link = template.replace("${old}", previousVersion).replace("${new}", version);

    return `[${version}]: ${link}`;
  },

  versionHeaderMatcher(content: string, version: string): string | undefined {
    // Match Keep a Changelog version headers
    const versionRegex = new RegExp(`^(## \\[${version}\\] - (?:[^\n]+))$`, "m");
    const match = content.match(versionRegex);
    return match ? match[1] : undefined;
  },

  changelogHeaderMatcher(content: string): number {
    // Find the position after the first version header
    const firstVersionMatch = content.match(/^## \[[^\]]+\] - [^\n]+$/m);
    if (!firstVersionMatch) {
      // If no version header found, find the position after the main header
      const mainHeaderMatch = content.match(/^# Changelog$/m);
      return mainHeaderMatch ? mainHeaderMatch.index! + mainHeaderMatch[0].length + 1 : 0;
    }
    return firstVersionMatch.index!;
  },
};

export default keepachangelog;
