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
export declare function run(options?: ValidateOptions): Promise<string>;
export {};
//# sourceMappingURL=validate.d.ts.map