import { ChangeFile, Config } from "../types";
import { defaultConfig } from "./config";

/**
 * Comparator functions for each ordering criteria
 */
const comparators: Record<Config["ordering"][number], (a: ChangeFile, b: ChangeFile) => number> = {
  /**
   * Sort by change type alphabetically
   */
  type: (a, b) => a.type.localeCompare(b.type),

  /**
   * Sort by significance (major > minor > patch)
   */
  significance: (a, b) => {
    const significanceOrder = { major: 0, minor: 1, patch: 2 };
    return significanceOrder[a.significance] - significanceOrder[b.significance];
  },

  /**
   * Sort by timestamp (oldest first, missing timestamps go last)
   */
  timestamp: (a, b) => {
    // If both have timestamps, compare them
    if (a.timestamp && b.timestamp) {
      return a.timestamp.localeCompare(b.timestamp);
    }
    // If only one has a timestamp, the one with timestamp comes first
    if (a.timestamp && !b.timestamp) return -1;
    if (!a.timestamp && b.timestamp) return 1;
    // If neither has a timestamp, they're equal for this criterion
    return 0;
  },

  /**
   * Sort by entry content alphabetically
   */
  content: (a, b) => a.entry.localeCompare(b.entry),
};

/**
 * Sorts changelog entries based on the configured ordering criteria.
 *
 * The ordering array specifies the priority of sort criteria, where the first
 * element is the primary sort key, the second is the secondary (used when primary
 * values are equal), and so on.
 *
 * @param changes - Array of change files to sort
 * @param ordering - Array of ordering criteria from config (defaults to defaultConfig.ordering)
 * @returns The sorted array (sorted in place)
 *
 * @example
 * ```typescript
 * // Sort primarily by type, then by content within each type
 * sortChanges(changes, ["type", "content"]);
 *
 * // Sort primarily by significance, then by type, then by content
 * sortChanges(changes, ["significance", "type", "content"]);
 * ```
 */
export function sortChanges(changes: ChangeFile[], ordering: Config["ordering"] = defaultConfig.ordering): ChangeFile[] {
  return changes.sort((a, b) => {
    for (const criterion of ordering) {
      const comparator = comparators[criterion];
      const result = comparator(a, b);
      // If the comparison is not equal, return the result
      // Otherwise, continue to the next criterion
      if (result !== 0) {
        return result;
      }
    }
    // If all criteria are equal, maintain original order
    return 0;
  });
}
