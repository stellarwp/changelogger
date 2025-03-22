import * as path from "path";
import { ChangeFile, Config, WriteCommandOptions } from "../types";

export interface WritingStrategy {
  /**
   * Format the changes into a changelog entry
   */
  formatChanges: (
    version: string,
    changes: ChangeFile[],
    previousVersion?: string,
  ) => string;

  /**
   * Format the header for a new version
   */
  formatVersionHeader: (
    version: string,
    date: string,
    previousVersion?: string,
  ) => string;

  /**
   * Format the link to compare versions (if supported)
   */
  formatVersionLink?: (
    version: string,
    previousVersion: string,
    template?: string,
  ) => string;

  /**
   * Match an existing version header in the changelog
   * Returns the matched version if found, undefined if not
   */
  versionHeaderMatcher: (
    content: string,
    version: string,
  ) => string | undefined;

  /**
   * Match where to insert new changelog entries
   * Returns the index where new entries should be inserted
   */
  changelogHeaderMatcher: (content: string) => number;

  /**
   * Handle additional files that need to be updated with the changelog
   * Returns an array of promises for each file operation
   */
  handleAdditionalFiles?: (
    version: string,
    date: string,
    changes: ChangeFile[],
    config: Config,
    options?: WriteCommandOptions,
  ) => Promise<void>[];
}

export async function loadWritingStrategy(
  formatter: string,
): Promise<WritingStrategy> {
  // If it's a file path, try to load it
  if (formatter.endsWith(".js") || formatter.endsWith(".ts")) {
    try {
      const absolutePath = path.resolve(process.cwd(), formatter);
      const module = await import(absolutePath);

      // Validate that the module exports the required methods
      if (
        typeof module.formatChanges !== "function" ||
        typeof module.formatVersionHeader !== "function" ||
        typeof module.versionHeaderMatcher !== "function" ||
        typeof module.changelogHeaderMatcher !== "function"
      ) {
        throw new Error(
          `Writing strategy file ${formatter} does not export required methods`,
        );
      }

      return module as WritingStrategy;
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : String(err);
      throw new Error(
        `Failed to load writing strategy file ${formatter}: ${error}`,
      );
    }
  }

  // Handle built-in writing strategies
  switch (formatter) {
    case "keepachangelog":
      return (await import("./writing/keepachangelog")).default;
    case "stellarwp-changelog":
      return (await import("./writing/stellarwp-changelog")).default;
    case "stellarwp-readme":
      return (await import("./writing/stellarwp-readme")).default;
    default:
      throw new Error(`Unknown writing strategy: ${formatter}`);
  }
}
