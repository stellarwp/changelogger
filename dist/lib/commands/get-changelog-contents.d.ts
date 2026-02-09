import { GetChangelogContentsOptions } from "../types";
/**
 * Retrieves the already-written changelog contents for a specific version.
 *
 * This command reads a changelog file and extracts the entries (without the
 * version header) for the requested version. It uses the file's configured
 * writing strategy to correctly identify version boundaries.
 *
 * @param options - Command options
 * @param options.version - The version to retrieve contents for
 * @param options.file - Optional path to a specific configured changelog file
 *
 * @returns A promise that resolves to the changelog entries for the version
 * @throws {Error} If the version is not found or the file cannot be read
 */
export declare function run(options: GetChangelogContentsOptions): Promise<string>;
//# sourceMappingURL=get-changelog-contents.d.ts.map