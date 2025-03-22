import * as fs from "fs/promises";
import * as path from "path";
import { ChangeFile, Config, WriteCommandOptions } from "../../types";
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

  versionHeaderMatcher(content: string, version: string): string | undefined {
    // Match StellarWP version headers
    const versionRegex = new RegExp(`^= \\[${version}\\] ([^=]+) =$`, 'm');
    const match = content.match(versionRegex);
    return match ? match[1].trim() : undefined;
  },

  changelogHeaderMatcher(content: string): number {
    // Find the position after the first version header
    const firstVersionMatch = content.match(/^= \[[^\]]+\] [^=]+ =$/m);
    if (!firstVersionMatch) {
      // If no version header found, find the position after the main header
      const mainHeaderMatch = content.match(/^== Changelog ==$/m);
      return mainHeaderMatch ? mainHeaderMatch.index! + mainHeaderMatch[0].length + 1 : 0;
    }
    return firstVersionMatch.index!;
  },

  handleAdditionalFiles(
    version: string,
    date: string,
    changes: ChangeFile[],
    config: Config,
    options?: WriteCommandOptions,
  ): Promise<void>[] {
    const promises: Promise<void>[] = [];

    // Handle readme file
    promises.push(
      (async () => {
        try {
          // Use readmeFile from config if available, otherwise fallback to readme.txt
          const readmePath = path.join(
            process.cwd(),
            config.readmeFile || "readme.txt",
          );
          let readmeContent = await fs.readFile(readmePath, "utf8");

          // Generate WordPress-style changelog entry
          const wpEntry = `\n= [${version}] - ${date} =\n\n`;
          const formattedChanges = changes.reduce((acc, change) => {
            const type = config.types[change.type];
            if (change.entry) {
              acc.push(`* ${type} - ${change.entry}`);
            }
            return acc;
          }, [] as string[]);

          const wpChanges = formattedChanges.join("\n");

          // Insert after == Changelog == line
          readmeContent = readmeContent.replace(
            /(== Changelog ==\n)/,
            `$1${wpEntry}${wpChanges}\n`,
          );

          if (options?.dryRun) {
            // In dry run mode, just log what would be written
            console.log(`[DRY RUN] Would write to ${readmePath}:`);
            console.log("=== Changes to be written ===");
            console.log(wpEntry + wpChanges);
            console.log("===========================");
          } else {
            await fs.writeFile(readmePath, readmeContent);

            // Handle version rotation if specified
            if (options?.rotateVersions) {
              // Find all version entries
              const versionMatches = readmeContent.matchAll(
                /= \[([^\]]+)\] - ([^\n]+) =/g,
              );
              const versions = Array.from(versionMatches).map((match) => ({
                version: match[1],
                date: match[2],
                startIndex: match.index!,
                endIndex: match.index! + match[0].length,
              }));

              // If we have more versions than allowed, remove the oldest ones
              if (versions.length > options.rotateVersions) {
                // Sort versions by date (newest first)
                versions.sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime(),
                );

                // Keep only the allowed number of versions
                const versionsToKeep = versions.slice(
                  0,
                  options.rotateVersions,
                );

                // Find the end of the last version to keep
                const lastVersionToKeep =
                  versionsToKeep[versionsToKeep.length - 1];
                const nextVersionStart = versions.find(
                  (v) => v.startIndex > lastVersionToKeep.endIndex,
                )?.startIndex;

                // Extract the content up to the last version to keep
                const contentToKeep = readmeContent.substring(
                  0,
                  nextVersionStart || readmeContent.length,
                );

                // Write the rotated content back to the file
                await fs.writeFile(readmePath, contentToKeep);
              }
            }
          }
        } catch (error) {
          if ((error as { code: string }).code !== "ENOENT") {
            throw error;
          }
          // Silently ignore if readme file doesn't exist
        }
      })(),
    );

    return promises;
  },
};

export default stellarwp;
