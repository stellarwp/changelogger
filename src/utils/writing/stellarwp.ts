import * as fs from "fs/promises";
import * as path from "path";
import { ChangeFile, Config } from "../../types";
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

    // Format each type's changes using the original types from the changes
    const sections = Object.entries(groupedChanges)
      .map(([type, entries]) => {
        // Capitalize the first letter of the type
        const formattedType = type.charAt(0).toUpperCase() + type.slice(1);
        return entries
          .map((entry) => `* ${formattedType} - ${entry}`)
          .join("\n");
      })
      .filter((section) => section.length > 0);

    return sections.join("\n");
  },

  formatVersionHeader(
    version: string,
    date: string,
    previousVersion?: string,
  ): string {
    return `### [${version}] ${date}\n\n`;
  },

  formatVersionLink(
    version: string,
    previousVersion: string,
    template?: string,
  ): string {
    // StellarWP format doesn't use version links
    return "";
  },

  handleAdditionalFiles(
    version: string,
    date: string,
    changes: ChangeFile[],
    config: Config,
  ): Promise<void>[] {
    const promises: Promise<void>[] = [];

    // Handle readme.txt
    promises.push(
      (async () => {
        try {
          const readmeTxtPath = path.join(process.cwd(), "readme.txt");
          let readmeTxt = await fs.readFile(readmeTxtPath, "utf8");

          // Generate WordPress-style changelog entry
          const wpEntry = `\n= [${version}] ${date} =\n\n`;
          const formattedChanges = changes.reduce((acc, change) => {
            const type = config.types[change.type];
            if (change.entry) {
              acc.push(`* ${type} - ${change.entry}`);
            }
            return acc;
          }, [] as string[]);

          const wpChanges = formattedChanges.join("\n");

          // Insert after == Changelog == line
          readmeTxt = readmeTxt.replace(
            /(== Changelog ==\n)/,
            `$1${wpEntry}${wpChanges}\n`,
          );

          await fs.writeFile(readmeTxtPath, readmeTxt);
        } catch (error) {
          if ((error as { code: string }).code !== "ENOENT") {
            throw error;
          }
          // Silently ignore if readme.txt doesn't exist
        }
      })(),
    );

    return promises;
  },
};

export default stellarwp;
