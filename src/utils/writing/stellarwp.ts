import { ChangeFile } from "../../types";
import { WritingStrategy } from "../writing";

const stellarwp: WritingStrategy = {
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

    // Define the order of types
    const typeOrder = ["Feature", "Tweak", "Fix", "Compatibility", "Language"];

    // Format each type's changes
    const sections = typeOrder
      .filter((type) => groupedChanges[type.toLowerCase()])
      .map((type) => {
        const entries = groupedChanges[type.toLowerCase()];
        return entries.map((entry) => `* ${type} - ${entry}`).join("\n");
      })
      .filter((section) => section.length > 0);

    // Add language section if there are changes
    const languageSection =
      "* Language - 0 new strings added, 0 updated, 0 fuzzied, and 0 obsoleted.";

    return [...sections, languageSection].join("\n");
  },

  formatVersionHeader(
    version: string,
    date: string,
    previousVersion?: string,
  ): string {
    return `= [${version}] ${date} =\n`;
  },

  formatVersionLink(
    version: string,
    previousVersion: string,
    template?: string,
  ): string {
    // StellarWP format doesn't use version links
    return "";
  },
};

export default stellarwp;
