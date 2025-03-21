/**
 * Example custom writing strategy that uses a simple flat format
 */

/**
 * Format the changes into a changelog entry
 * @param {string} version - The version being released
 * @param {Array<{type: string, entry: string}>} changes - The changes to format
 * @param {string} [previousVersion] - The previous version
 * @returns {string} The formatted changes
 */
export function formatChanges(version, changes) {
  return changes
    .map((change) => `* [${change.type.toUpperCase()}] ${change.entry}`)
    .join("\n");
}

/**
 * Format the header for a new version
 * @param {string} version - The version being released
 * @param {string} date - The release date
 * @param {string} [previousVersion] - The previous version
 * @returns {string} The formatted header
 */
export function formatVersionHeader(version, date) {
  return `# Version ${version} (${date})`;
}

/**
 * Format the link to compare versions
 * @param {string} version - The version being released
 * @param {string} previousVersion - The previous version
 * @param {string} [template] - The link template
 * @returns {string} The formatted link
 */
export function formatVersionLink(version, previousVersion, template) {
  if (!template) return "";

  const link = template
    .replace("${old}", previousVersion)
    .replace("${new}", version);

  return `Compare ${previousVersion}...${version}: ${link}`;
}
