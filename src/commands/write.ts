import * as fs from "fs/promises";
import * as path from "path";
import * as semver from "semver";
import * as yaml from "yaml";
import { loadConfig } from "../utils/config";
import { loadWritingStrategy } from "../utils/writing";
import { ChangeFile, WriteCommandOptions } from "../types";

/**
 * Writes changelog entries to the configured files.
 *
 * This command is part of the CLI tool and handles the process of:
 * 1. Reading all YAML change files from the changes directory
 * 2. Determining the next version number based on change significance (if not specified)
 * 3. Writing the changes to each configured file using its specific writing strategy
 * 4. Cleaning up processed change files
 *
 * The command can be used in three ways:
 * 1. Automatic versioning: When no version is specified, it will determine the next version
 * 2. Manual versioning: When a version is specified with --overwrite-version
 * 3. Dry run: When --dry-run is specified, it will show what would be written without making changes
 *
 * @example
 * ```bash
 * # Automatic versioning
 * changelogger write
 *
 * # Manual versioning
 * changelogger write --overwrite-version 1.2.3
 *
 * # Dry run - show what would be written without making changes
 * changelogger write --dry-run
 * ```
 *
 * @param options - Command options for controlling the write process
 * @param options.overwriteVersion - Optional version number to use instead of auto-determining
 * @param options.dryRun - If true, only show what would be written without making changes
 *
 * @returns A promise that resolves to a string message indicating the result
 * @throws {Error} If there are issues with file operations or invalid inputs
 */
export async function run(options: WriteCommandOptions): Promise<string> {
  const config = await loadConfig();
  const changes: ChangeFile[] = [];

  // Read all change files
  try {
    const files = await fs.readdir(config.changesDir);

    for (const file of files) {
      if (file.startsWith(".") || !file.endsWith(".yaml")) {
        continue;
      }

      const filePath = path.join(config.changesDir, file);
      const content = await fs.readFile(filePath, "utf8");
      const change = yaml.parse(content) as ChangeFile;
      changes.push(change);
    }
  } catch (error) {
    if ((error as { code: string }).code === "ENOENT") {
      return "No changes directory found";
    }
    throw error;
  }

  if (changes.length === 0) {
    return "No changes to write";
  }

  // Determine version bump
  let version = options.overwriteVersion;
  if (!version) {
    const currentVersion = await getCurrentVersion(config.files[0].path);
    const significance = determineSignificance(changes);
    version = getNextVersion(currentVersion, significance);
  }

  // Generate changelog entry
  const date = new Date().toISOString().split("T")[0];

  // If dry run, show what would be written and exit
  if (options.dryRun) {
    console.log("[DRY RUN] Would write the following changes:");
    console.log("=== Changelog Entries ===");

    // Show what would be written for each file
    for (const file of config.files) {
      const strategy = await loadWritingStrategy(file.strategy);
      const changelogEntryFormatted = strategy.formatChanges(version, changes);
      const versionHeader = strategy.formatVersionHeader(version, date);
      const versionLink =
        strategy.formatVersionLink?.(
          version,
          await getCurrentVersion(file.path),
          config.linkTemplate,
        ) || "";
      const entry = `${versionHeader}${changelogEntryFormatted}\n${versionLink}`;

      console.log(`\nFile: ${file.path}`);
      console.log(entry);
    }
    console.log("=====================");
    return "Dry run completed - no changes were made";
  }

  // Process each file
  const results: string[] = [];
  for (const file of config.files) {
    const strategy = await loadWritingStrategy(file.strategy);
    const changelogEntryFormatted = strategy.formatChanges(version, changes);
    const versionHeader = strategy.formatVersionHeader(version, date);
    const versionLink =
      strategy.formatVersionLink?.(
        version,
        await getCurrentVersion(file.path),
        config.linkTemplate,
      ) || "";
    const entry = `${versionHeader}${changelogEntryFormatted}\n${versionLink}`;

    try {
      const content = await fs.readFile(file.path, "utf8");

      // Check if version already exists
      const existingDate = strategy.versionHeaderMatcher(content, version);
      if (existingDate) {
        // If version exists, append to it
        const updatedContent = content.replace(
          versionHeader.trim(),
          `${versionHeader.trim()}\n${changelogEntryFormatted}`,
        );
        await fs.writeFile(file.path, updatedContent);
        results.push(`Updated existing version ${version} in ${file.path}`);
      } else {
        // Find where to insert the new entry
        const insertIndex = strategy.changelogHeaderMatcher(content);
        const updatedContent =
          content.slice(0, insertIndex) + entry + content.slice(insertIndex);
        await fs.writeFile(file.path, updatedContent);
        results.push(`Updated ${file.path} to version ${version}`);
      }
    } catch (error) {
      if ((error as { code: string }).code === "ENOENT") {
        // File doesn't exist, create it with header
        const header = "# Changelog\n\n";
        await fs.writeFile(file.path, header + entry);
        results.push(`Created ${file.path} with version ${version}`);
      } else {
        throw error;
      }
    }
  }

  // Clean up change files
  for (const file of await fs.readdir(config.changesDir)) {
    if (!file.startsWith(".") && file.endsWith(".yaml")) {
      await fs.unlink(path.join(config.changesDir, file));
    }
  }

  return results.join("\n");
}

/**
 * Gets the current version from a file.
 *
 * @param filePath - Path to the file
 * @returns The current version string
 */
async function getCurrentVersion(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath, "utf8");
    // Try StellarWP format first
    let match = content.match(/= \[([^\]]+)\]/);
    if (!match) {
      // Try Keep a Changelog format
      match = content.match(/## \[([^\]]+)\]/);
    }
    return match ? match[1] : "0.1.0";
  } catch (error) {
    if ((error as { code: string }).code === "ENOENT") {
      return "0.1.0";
    }
    throw error;
  }
}

/**
 * Determines the overall significance of a set of changes.
 *
 * @param changes - Array of change files
 * @returns The highest significance level among the changes
 */
function determineSignificance(
  changes: ChangeFile[],
): "major" | "minor" | "patch" {
  if (changes.some((c) => c.significance === "major")) return "major";
  if (changes.some((c) => c.significance === "minor")) return "minor";
  return "patch";
}

/**
 * Gets the next version number based on the current version and significance.
 *
 * @param currentVersion - The current version string
 * @param significance - The significance of the changes
 * @returns The next version string
 */
function getNextVersion(
  currentVersion: string,
  significance: "major" | "minor" | "patch",
): string {
  const version = semver.valid(currentVersion) || "0.1.0";
  return semver.inc(version, significance) || "0.1.0";
}
