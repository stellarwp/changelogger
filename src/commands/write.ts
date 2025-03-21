import * as fs from "fs/promises";
import * as path from "path";
import * as semver from "semver";
import * as yaml from "yaml";
import { loadConfig } from "../utils/config";
import { loadWritingStrategy } from "../utils/writing";
import { ChangeFile, WriteCommandOptions } from "../types";

/**
 * Writes changelog entries to the main changelog file.
 *
 * This command is part of the CLI tool and handles the process of:
 * 1. Reading all YAML change files from the changes directory
 * 2. Determining the next version number based on change significance
 * 3. Writing the changes to the main changelog file using the configured writing strategy
 * 4. Cleaning up processed change files
 *
 * The command can be used in two ways:
 * 1. Automatic versioning: When no version is specified, it will determine the next version
 * 2. Manual versioning: When a version is specified, it will use that version
 *
 * @example
 * ```bash
 * # Automatic versioning
 * changelogger write
 *
 * # Manual versioning
 * changelogger write --version 1.2.3
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
    const currentVersion = await getCurrentVersion(config.changelogFile);
    const significance = determineSignificance(changes);
    version = getNextVersion(currentVersion, significance);
  }

  // Group changes by type
  const groupedChanges = changes.reduce(
    (acc, change) => {
      const type = config.types[change.type];
      acc[type] = acc[type] || [];
      acc[type].push(change.entry);
      return acc;
    },
    {} as Record<string, string[]>,
  );

  // Generate changelog entry
  const date = new Date().toISOString().split("T")[0];
  const writingStrategy = await loadWritingStrategy(config.formatter);
  const changelogEntryFormatted = writingStrategy.formatChanges(
    version,
    changes,
  );
  const versionHeader = writingStrategy.formatVersionHeader(version, date);
  const versionLink =
    writingStrategy.formatVersionLink?.(
      version,
      await getCurrentVersion(config.changelogFile),
      config.linkTemplate,
    ) || "";
  const entry = `${versionHeader}${changelogEntryFormatted}\n${versionLink}`;

  // If dry run, show what would be written and exit
  if (options.dryRun) {
    console.log("[DRY RUN] Would write the following changes:");
    console.log("=== Changelog Entry ===");
    console.log(entry);
    console.log("=====================");

    // Load writing strategy to show additional files that would be updated
    const strategy = await loadWritingStrategy(config.formatter);
    if (strategy.handleAdditionalFiles) {
      const filePromises = strategy.handleAdditionalFiles(
        version,
        date,
        changes,
        config,
        options,
      );
      await Promise.all(filePromises);
    }

    return "Dry run completed - no changes were made";
  }

  // Check if version already exists in changelog
  let versionExists = false;
  try {
    const changelogContent = await fs.readFile(config.changelogFile, "utf8");
    versionExists = changelogContent.includes(versionHeader.trim());
    if (versionExists) {
      // If version exists, we'll append to it
      const changelogEntry = writingStrategy.formatChanges(version, changes);

      // Insert the new changes after the existing version header
      const updatedContent = changelogContent.replace(
        versionHeader.trim(),
        `${versionHeader.trim()}\n${changelogEntry}`,
      );

      await fs.writeFile(config.changelogFile, updatedContent);

      // Clean up change files
      for (const file of await fs.readdir(config.changesDir)) {
        if (file.startsWith(".") || !file.endsWith(".yaml")) {
          continue;
        }
        await fs.unlink(path.join(config.changesDir, file));
      }

      return `Updated existing version ${version} in changelog.md`;
    }
  } catch (error) {
    if ((error as { code: string }).code !== "ENOENT") {
      throw error;
    }
  }

  // Update changelog file
  try {
    let changelog = await fs.readFile(config.changelogFile, "utf8");
    const firstEntry = changelog.indexOf("\n= [");
    if (firstEntry > -1) {
      // Insert after the header but before the first entry
      changelog = `${changelog.slice(0, firstEntry)} \n ${entry} ${changelog.slice(firstEntry)}`;
    } else {
      // No existing entries, just append
      changelog = changelog.replace(/^(# Changelog\n)/, `$1\n${entry}`);
    }
    await fs.writeFile(config.changelogFile, changelog);
  } catch (error) {
    if ((error as { code: string }).code === "ENOENT") {
      const header =
        "# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n";
      await fs.writeFile(config.changelogFile, header + entry);
    } else {
      throw error;
    }
  }

  // Load and use the writing strategy
  const strategy = await loadWritingStrategy(config.formatter);

  // Handle additional files if the strategy supports it
  if (strategy.handleAdditionalFiles) {
    const filePromises = strategy.handleAdditionalFiles(
      version,
      date,
      changes,
      config,
      options,
    );
    await Promise.all(filePromises);
  }

  // Clean up change files
  for (const file of await fs.readdir(config.changesDir)) {
    if (!file.startsWith(".") && file.endsWith(".yaml")) {
      await fs.unlink(path.join(config.changesDir, file));
    }
  }

  return versionExists
    ? `Updated existing version ${version} in changelog.md`
    : `Updated changelog.md to version ${version}`;
}

/**
 * Gets the current version from the changelog file.
 *
 * @param changelogFile - Path to the changelog file
 * @returns The current version string
 */
async function getCurrentVersion(changelogFile: string): Promise<string> {
  try {
    const content = await fs.readFile(changelogFile, "utf8");
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
