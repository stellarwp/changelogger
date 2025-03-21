import { ChangeFile } from "../../types";
import { WritingStrategy } from "../writing";

const keepachangelog: WritingStrategy = {
  formatChanges(
    version: string,
    changes: ChangeFile[],
    previousVersion?: string,
  ): string {
    // Group changes by type
    const groupedChanges = changes.reduce(
      (acc, change) => {
        if (!acc[change.type]) {
          acc[change.type] = [];
        }
        acc[change.type].push(change.entry);
        return acc;
      },
      {} as Record<string, string[]>,
    );

    // Format each type's changes
    const sections = Object.entries(groupedChanges).map(([type, entries]) => {
      const title = type.charAt(0).toUpperCase() + type.slice(1);
      const items = entries.map((entry) => `- ${entry}`).join("\n");
      return `### ${title}\n${items}`;
    });

    return sections.join("\n\n");
  },

  formatVersionHeader(
    version: string,
    date: string,
    previousVersion?: string,
  ): string {
    return `## [${version}] - ${date}`;
  },

  formatVersionLink(
    version: string,
    previousVersion: string,
    template?: string,
  ): string {
    if (!template) return "";

    const link = template
      .replace("${old}", previousVersion)
      .replace("${new}", version);

    return `[${version}]: ${link}`;
  },
};

export default keepachangelog;
