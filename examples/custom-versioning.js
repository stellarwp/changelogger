/**
 * Example custom versioning strategy that uses a simple numeric version scheme (e.g., 1.2.3)
 * This file demonstrates how to create a custom versioning strategy for @stellarwp/changelogger
 */

module.exports = {
  /**
   * Get the next version based on the current version and significance
   * @param {string} currentVersion - The current version
   * @param {'major'|'minor'|'patch'} significance - The significance of the change
   * @returns {string} The next version
   */
  getNextVersion(currentVersion, significance) {
    const [major, minor, patch] = currentVersion.split(".").map(Number);

    switch (significance) {
      case "major":
        return `${major + 1}.0.0`;
      case "minor":
        return `${major}.${minor + 1}.0`;
      case "patch":
        return `${major}.${minor}.${patch + 1}`;
      default:
        return currentVersion;
    }
  },

  /**
   * Validate if a version string is valid
   * @param {string} version - The version to validate
   * @returns {boolean} Whether the version is valid
   */
  isValidVersion(version) {
    const parts = version.split(".");
    if (parts.length !== 3) return false;

    return parts.every(part => {
      const num = Number(part);
      return Number.isInteger(num) && num >= 0;
    });
  },

  /**
   * Compare two versions
   * @param {string} v1 - First version
   * @param {string} v2 - Second version
   * @returns {number} Negative if v1 < v2, 0 if equal, positive if v1 > v2
   */
  compareVersions(v1, v2) {
    const [major1, minor1, patch1] = v1.split(".").map(Number);
    const [major2, minor2, patch2] = v2.split(".").map(Number);

    if (major1 !== major2) return major1 - major2;
    if (minor1 !== minor2) return minor1 - minor2;
    return patch1 - patch2;
  },
};
