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
export declare function run(): Promise<string>;
