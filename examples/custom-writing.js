/**
 * Example custom writing strategy that uses a simple flat format
 * This file demonstrates how to create a custom writing strategy for @stellarwp/changelogger
 * 
 * Note: When using this strategy with changelogger, you can also import utilities:
 * const { getTypeLabel, defaultConfig } = require('@stellarwp/changelogger');
 */

module.exports = {
  /**
   * Format the changes into a changelog entry
   * @param {string} version - The version being released
   * @param {Array<{type: string, entry: string, significance: string}>} changes - The changes to format
   * @param {string} [previousVersion] - The previous version
   * @returns {string} The formatted changes
   */
  formatChanges(version, changes) {
    // Group changes by type for better organization
    const grouped = {};
    for (const change of changes) {
      if (!grouped[change.type]) {
        grouped[change.type] = [];
      }
      grouped[change.type].push(change.entry);
    }
    
    // Format each group with a header
    let output = '';
    for (const [type, entries] of Object.entries(grouped)) {
      // Custom format: use uppercase type with emoji
      const emoji = {
        added: '✨',
        changed: '🔄',
        deprecated: '⚠️',
        removed: '🗑️',
        fix: '🐛',
        security: '🔒',
        feature: '🚀',
        tweak: '🔧'
      }[type] || '📝';
      
      output += `\n${emoji} ${type.toUpperCase()}\n`;
      for (const entry of entries) {
        output += `   * ${entry}\n`;
      }
    }
    
    return output;
  },

  /**
   * Format the header for a new version
   * @param {string} version - The version being released
   * @param {string} date - The release date
   * @param {string} [previousVersion] - The previous version
   * @returns {string} The formatted header
   */
  formatVersionHeader(version, date) {
    return `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nVersion ${version} (${date})\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  },

  /**
   * Format the link to compare versions (optional)
   * @param {string} version - The version being released
   * @param {string} previousVersion - The previous version
   * @param {string} [template] - The link template
   * @returns {string} The formatted link
   */
  formatVersionLink(version, previousVersion, template) {
    if (!template) return "";

    const link = template
      .replace('{version}', version)
      .replace('{previousVersion}', previousVersion);

    return `\n🔗 Compare changes: ${link}\n`;
  },

  /**
   * Match an existing version header in the changelog
   * @param {string} content - Existing changelog content
   * @param {string} version - Version to find
   * @returns {string|undefined} Matched header or undefined
   */
  versionHeaderMatcher(content, version) {
    // Match our custom header format
    const regex = new RegExp(`Version ${version} \\([^)]+\\)`, 'm');
    const match = content.match(regex);
    return match ? match[0] : undefined;
  },

  /**
   * Find where to insert new changelog entries
   * @param {string} content - Existing changelog content
   * @returns {number} Index where new entries should be inserted
   */
  changelogHeaderMatcher(content) {
    // Look for the first version header
    const match = content.match(/Version \d+\.\d+\.\d+ \(/m);
    if (match && match.index !== undefined) {
      return match.index;
    }
    
    // Look for a main header
    const headerMatch = content.match(/^# CHANGELOG/im);
    if (headerMatch && headerMatch.index !== undefined) {
      return headerMatch.index + headerMatch[0].length + 1;
    }
    
    // Default to beginning
    return 0;
  }
};
