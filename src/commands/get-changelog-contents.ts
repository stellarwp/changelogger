import * as fs from "fs/promises";
import { marked } from "marked";
import { loadConfig } from "../utils/config";
import { loadWritingStrategy } from "../utils/writing";
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
export async function run(options: GetChangelogContentsOptions): Promise<string> {
  const config = await loadConfig();

  // Determine which file to read from
  let fileConfig: (typeof config.files)[number] | undefined;

  if (options.file) {
    fileConfig = config.files.find(f => f.path === options.file);
    if (!fileConfig) {
      throw new Error(`File "${options.file}" is not a configured changelog file. Configured files: ${config.files.map(f => f.path).join(", ")}`);
    }
  } else {
    fileConfig = config.files[0];
    if (!fileConfig) {
      throw new Error("No files configured for changelog");
    }
  }

  // Load the writing strategy for this file
  const strategy = await loadWritingStrategy(fileConfig.strategy);

  // Read the file content
  const content = await fs.readFile(fileConfig.path, "utf8");

  // Find the version header
  const versionHeader = strategy.versionHeaderMatcher(content, options.version);
  if (!versionHeader) {
    throw new Error(`Version ${options.version} not found in ${fileConfig.path}`);
  }

  // Find the start of the version section header
  const versionHeaderStart = content.indexOf(versionHeader);

  // Find where the version header line ends
  const headerLineEnd = content.indexOf("\n", versionHeaderStart) + 1;

  // Skip any empty lines after the header
  let contentStart = headerLineEnd;
  while (contentStart < content.length && content[contentStart] === "\n") {
    contentStart++;
  }

  // Get everything after the header (after any blank lines)
  const contentAfterHeader = content.slice(contentStart);

  // Use the strategy's changelogHeaderMatcher to find the next version header
  const nextVersionIndex = strategy.changelogHeaderMatcher(contentAfterHeader);

  let entries: string;

  if (nextVersionIndex > 0) {
    // Found a next version — extract only entries up to it
    entries = contentAfterHeader.slice(0, nextVersionIndex).trimEnd();
  } else {
    // No next version found — all remaining content belongs to this version
    entries = contentAfterHeader.trimEnd();
  }

  if (options.html) {
    return (marked.parse(entries) as string).trimEnd();
  }

  return entries;
}
