import * as fs from "fs/promises";
import * as path from "path";
import { loadConfig } from "../utils/config";
import { ChangeFile, ChangeType, Config, Significance } from "../types";
import * as yaml from "yaml";
import { execSync } from "child_process";

interface ValidateOptions {
  file?: string;
  from?: string;
  to?: string;
}

/**
 * Validates changelog entries.
 *
 * This command can be used in two ways:
 * 1. Validate all changelog entries in the changes directory
 * 2. Validate a specific changelog file
 * 3. Validate that at least one changelog was added between two git commits
 *
 * @example
 * ```bash
 * # Validate all change files
 * changelogger validate
 *
 * # Validate a specific file
 * changelogger validate --file changelog/feature-123.yaml
 *
 * # Validate changes between commits
 * changelogger validate --from main --to feature-branch
 * ```
 *
 * @param options - Command options for validation
 * @param options.file - Optional specific file to validate
 * @param options.from - Optional git commit/tag/branch to compare from
 * @param options.to - Optional git commit/tag/branch to compare to
 *
 * @returns A promise that resolves to a string message indicating the validation result
 * @throws {Error} If validation fails, with details about the validation errors
 */
export async function run(options: ValidateOptions = {}): Promise<string> {
  const config = await loadConfig();
  const errors: string[] = [];

  // If file is specified, validate only that file
  if (options.file) {
    try {
      const content = await fs.readFile(options.file, "utf8");
      const changeFile = yaml.parse(content) as ChangeFile;
      validateChangeFile(changeFile, options.file, config, errors);
    } catch (error) {
      if ((error as { code: string }).code === "ENOENT") {
        throw new Error(`File not found: ${options.file}`);
      }
      errors.push(`${options.file}: Invalid YAML format`);
    }
  }
  // If from and to are specified, validate git changes
  else if (options.from && options.to) {
    try {
      const changes = execSync(`git diff --name-only ${options.from} ${options.to}`).toString().split("\n");
      const changelogFiles = changes.filter(file => file.startsWith(config.changesDir) && file.endsWith(".yaml"));
      console.log(changes);

      if (changelogFiles.length === 0) {
        throw new Error(`No changelog entries found between ${options.from} and ${options.to}`);
      }

      for (const file of changelogFiles) {
        const content = await fs.readFile(file, "utf8");
        const changeFile = yaml.parse(content) as ChangeFile;
        validateChangeFile(changeFile, file, config, errors);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Git validation failed: ${error.message}`);
      }
      throw error;
    }
  }
  // Validate all files in the changes directory
  else {
    try {
      const files = await fs.readdir(config.changesDir);

      for (const file of files) {
        if (file.startsWith(".") || !file.endsWith(".yaml")) {
          continue;
        }

        const filePath = path.join(config.changesDir, file);
        const content = await fs.readFile(filePath, "utf8");

        try {
          const changeFile = yaml.parse(content) as ChangeFile;
          validateChangeFile(changeFile, file, config, errors);
        } catch (error) {
          errors.push(`${file}: Invalid YAML format`);
        }
      }
    } catch (error) {
      if ((error as { code: string }).code === "ENOENT") {
        return "No changes directory found";
      }
      throw error;
    }
  }

  if (errors.length > 0) {
    throw new Error(`Validation failed:\n${errors.join("\n")}`);
  }

  return "All change files are valid";
}

/**
 * Validates a single change file.
 *
 * @param changeFile - The change file to validate
 * @param filename - The name of the file being validated
 * @param config - The configuration object
 * @param errors - Array to collect validation errors
 */
function validateChangeFile(changeFile: ChangeFile, filename: string, config: Config, errors: string[]): void {
  // Validate significance
  if (!["patch", "minor", "major"].includes(changeFile.significance)) {
    errors.push(`${filename}: Invalid significance "${changeFile.significance}"`);
  }

  // Validate type
  if (!Object.keys(config.types).includes(changeFile.type)) {
    errors.push(`${filename}: Invalid type "${changeFile.type}"`);
  }

  // Validate entry
  if (!changeFile.entry && changeFile.significance !== "patch") {
    errors.push(`${filename}: Entry is required for non-patch changes`);
  }
}
