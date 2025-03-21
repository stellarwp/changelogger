import * as fs from "fs/promises";
import * as path from "path";
import * as semver from "semver";
import * as yaml from "yaml";
import { loadConfig } from "../utils/config";
import { loadWritingStrategy } from "../utils/writing";
import { ChangeFile, WriteCommandOptions } from "../types";

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
  let version = options.version;
  if (!version) {
    const currentVersion = await getCurrentVersion(config.changelogFile);
    const significance = determineSignificance(changes);
    version = getNextVersion(currentVersion, significance);
  } else {
    // Check if version already exists in changelog
    try {
      const changelogContent = await fs.readFile(config.changelogFile, "utf8");
      const versionExists = changelogContent.includes(`## [${version}]`);
      if (versionExists) {
        // If version exists, we'll append to it
        const writingStrategy = await loadWritingStrategy(config.formatter);
        const date = new Date().toISOString().split("T")[0];
        const entry = writingStrategy.formatChanges(version, changes);

        // Insert the new changes after the existing version header
        const updatedContent = changelogContent.replace(
          `## [${version}]`,
          `## [${version}]\n${entry}`,
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
  let entry = `\n## [${version}] - ${date}\n`;

  for (const [type, entries] of Object.entries(groupedChanges)) {
    entry += `\n### ${type}\n`;
    for (const text of entries) {
      if (text) {
        entry += `- ${text}\n`;
      }
    }
  }

  // Update changelog file
  try {
    let changelog = await fs.readFile(config.changelogFile, "utf8");
    changelog = changelog.replace(/^(# Change Log\n)/, `$1${entry}`);
    await fs.writeFile(config.changelogFile, changelog);
  } catch (error) {
    if ((error as { code: string }).code === "ENOENT") {
      const header =
        "# Change Log\n\nAll notable changes to this project will be documented in this file.\n";
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
    );
    await Promise.all(filePromises);
  }

  // Clean up change files
  for (const file of await fs.readdir(config.changesDir)) {
    if (!file.startsWith(".") && file.endsWith(".yaml")) {
      await fs.unlink(path.join(config.changesDir, file));
    }
  }

  return `Updated ${config.changelogFile} to version ${version}`;
}

async function getCurrentVersion(changelogFile: string): Promise<string> {
  try {
    const content = await fs.readFile(changelogFile, "utf8");
    const match = content.match(/## \[([^\]]+)\]/);
    return match ? match[1] : "0.1.0";
  } catch (error) {
    if ((error as { code: string }).code === "ENOENT") {
      return "0.1.0";
    }
    throw error;
  }
}

function determineSignificance(
  changes: ChangeFile[],
): "major" | "minor" | "patch" {
  if (changes.some((c) => c.significance === "major")) return "major";
  if (changes.some((c) => c.significance === "minor")) return "minor";
  return "patch";
}

function getNextVersion(
  currentVersion: string,
  significance: "major" | "minor" | "patch",
): string {
  const version = semver.valid(currentVersion) || "0.1.0";
  return semver.inc(version, significance) || "0.1.0";
}
