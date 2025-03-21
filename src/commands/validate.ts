import * as fs from "fs/promises";
import * as path from "path";
import { loadConfig } from "../utils/config";
import { ChangeFile, ChangeType, Significance } from "../types";
import * as yaml from "yaml";

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
          errors.push(
            `${file}: Invalid significance "${changeFile.significance}"`,
          );
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
