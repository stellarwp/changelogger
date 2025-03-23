import { AddCommandOptions } from "../types";
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
export declare function run(options: AddCommandOptions): Promise<string>;
