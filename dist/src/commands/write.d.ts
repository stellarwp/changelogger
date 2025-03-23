import { WriteCommandOptions } from "../types";
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
export declare function run(options: WriteCommandOptions): Promise<string>;
