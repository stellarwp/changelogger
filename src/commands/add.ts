import inquirer from "inquirer";
import * as fs from "fs/promises";
import * as path from "path";
import * as yaml from "yaml";
import { AddCommandOptions, ChangeFile, ChangeType, Significance } from "../types";
import { loadConfig } from "../utils/config";
import { getBranchName } from "../utils/git";

/**
 * Cleans up a string to be used as a filename
 * - Converts to lowercase
 * - Replaces non-alphanumeric characters with hyphens
 * - Removes leading/trailing hyphens
 * - Collapses multiple hyphens into one
 *
 * @param name - The string to clean up
 * @returns A cleaned up string suitable for use as a filename
 */
function cleanupFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

/**
 * Adds a new changelog entry to the project.
 *
 * This command is part of the CLI tool and handles the creation of new changelog entries.
 * It can be used in three ways:
 * 1. Interactive mode: When no options are provided, it will prompt the user for all required information
 * 2. Non-interactive mode with manual filename: When options are provided, it will use those values directly
 * 3. Non-interactive mode with auto-generated filename: When --auto-filename is provided, it will generate the filename automatically
 *
 * The command will:
 * - Create a new YAML file in the configured changes directory
 * - Generate a filename based on the branch name or timestamp
 * - Handle duplicate filenames by appending a timestamp
 * - Validate all inputs before creating the file
 *
 * @example
 * ```bash
 * # Interactive mode
 * changelogger add
 *
 * # Non-interactive mode with manual filename
 * changelogger add --significance minor --type feature --entry "Added new feature X"
 *
 * # Non-interactive mode with auto-generated filename
 * changelogger add --significance minor --type feature --entry "Added new feature X" --auto-filename
 * ```
 *
 * @param options - Command options that can be provided to skip interactive prompts
 * @param options.significance - The significance of the change (patch, minor, major)
 * @param options.type - The type of change (e.g., feature, fix, enhancement)
 * @param options.entry - The changelog entry text
 * @param options.filename - The desired filename for the changelog entry
 * @param options.autoFilename - If true, automatically generates the filename based on branch name or timestamp
 *
 * @returns A promise that resolves to a string message indicating the result
 * @throws {Error} If there are issues with file operations or invalid inputs
 */
export async function run(options: AddCommandOptions): Promise<string> {
  const config = await loadConfig();

  // Get the default filename from the branch name
  const branchName = await getBranchName();
  const defaultFilename = branchName ? cleanupFilename(branchName.replace(/\//g, "-")) : `change-${Date.now()}`;

  // If not all options are provided, prompt for them
  const answers = await inquirer.prompt<{
    significance?: string;
    type?: string;
    entry?: string;
    filename?: string;
  }>([
    {
      type: "list",
      name: "significance",
      message: "What is the significance of this change?",
      choices: ["patch", "minor", "major"],
      when: !options.significance,
    },
    {
      type: "list",
      name: "type",
      message: "What type of change is this?",
      choices: Object.keys(config.types),
      when: !options.type,
    },
    {
      type: "input",
      name: "entry",
      message: "Enter the changelog entry:",
      when: !options.entry,
      validate: (input: string) => {
        if (!input.trim()) {
          return "Changelog entry cannot be empty";
        }
        return true;
      },
      editor: false,
    },
    {
      type: "input",
      name: "filename",
      message: "Enter the filename for the change (without extension):",
      default: defaultFilename.replace(/\.yaml$/, ""),
      when: !options.filename && !options.autoFilename,
      validate: (input: string) => {
        if (!input.trim()) {
          return "Filename cannot be empty";
        }
        return true;
      },
      editor: false,
    },
  ]);

  const changeFile: ChangeFile = {
    significance: (options.significance || answers.significance) as Significance,
    type: (options.type || answers.type) as ChangeType,
    entry: options.entry || answers.entry || "",
    timestamp: new Date().toISOString(),
  };

  // Create changes directory if it doesn't exist
  await fs.mkdir(config.changesDir, { recursive: true });

  // Use provided filename, auto-generated filename, or the one from prompt
  const baseFilename = options.autoFilename ? defaultFilename : options.filename || answers.filename || defaultFilename;
  const filename = `${cleanupFilename(baseFilename)}`;
  const filePath = path.join(config.changesDir, `${filename}.yaml`);

  // Check if file exists
  try {
    await fs.access(filePath);
    // File exists, add timestamp
    const timestamp = Date.now();
    const newFilename = `${filename}-${timestamp}.yaml`;
    const newFilePath = path.join(config.changesDir, newFilename);
    await fs.writeFile(newFilePath, yaml.stringify(changeFile));
    return `File already exists. Created change file with timestamp: ${newFilePath}`;
  } catch (error) {
    // File doesn't exist, proceed with original filename
    await fs.writeFile(filePath, yaml.stringify(changeFile));
    return `Created change file: ${filePath}`;
  }
}
