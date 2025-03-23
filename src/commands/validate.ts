import * as fs from "fs/promises";
import * as path from "path";
import { loadConfig } from "../utils/config";
import { ChangeFile, ChangeType, Significance } from "../types";
import * as yaml from "yaml";

/**
 * Validates all changelog entries in the changes directory.
 *
 * This command is part of the CLI tool and performs validation checks on all YAML files
 * in the changes directory. It ensures that:
 * 1. All files are valid YAML
 * 2. Each change file has the required fields
 * 3. The significance value is valid (patch, minor, or major)
 * 4. The type value is valid according to the configuration
 * 5. Non-patch changes have an entry description
 *
 * @example
 * ```bash
 * # Validate all change files
 * changelogger validate
 * ```
 *
 * @returns A promise that resolves to a string message indicating the validation result
 * @throws {Error} If validation fails, with details about the validation errors
 */
export async function run(): Promise<string> {
  const config = await loadConfig();
  const errors: string[] = [];

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

        // Validate significance
        if (!["patch", "minor", "major"].includes(changeFile.significance)) {
          errors.push(`${file}: Invalid significance "${changeFile.significance}"`);
        }

        // Validate type
        if (!Object.keys(config.types).includes(changeFile.type)) {
          errors.push(`${file}: Invalid type "${changeFile.type}"`);
        }

        // Validate entry
        if (!changeFile.entry && changeFile.significance !== "patch") {
          errors.push(`${file}: Entry is required for non-patch changes`);
        }
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

  if (errors.length > 0) {
    throw new Error(`Validation failed:\n${errors.join("\n")}`);
  }

  return "All change files are valid";
}
