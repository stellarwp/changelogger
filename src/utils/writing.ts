import * as path from "path";
import { ChangeFile, Config, WriteCommandOptions } from "../types";

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

  /**
   * Extract the most recent version from the changelog content.
   * Returns the version string if found, undefined if no version headers exist.
   */
  getLatestVersion: (content: string) => string | undefined;
}

/**
 * Escapes every character that carries special meaning inside a regular
 * expression so a dynamic value is matched literally.
 *
 * Version strings reach `versionHeaderMatcher` from user input, so a value such
 * as `.*` would otherwise match a version header that was not requested. Every
 * built-in writing strategy runs the version through this before interpolating
 * it into a pattern, and custom writing strategies should do the same.
 *
 * @param value - The value to escape
 *
 * @returns The value with regular expression metacharacters escaped
 */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function loadWritingStrategy(formatter: string): Promise<WritingStrategy> {
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
        typeof module.changelogHeaderMatcher !== "function" ||
        typeof module.getLatestVersion !== "function"
      ) {
        throw new Error(`Writing strategy file ${formatter} does not export required methods`);
      }

      return module as WritingStrategy;
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to load writing strategy file ${formatter}: ${error}`);
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
