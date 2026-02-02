import { ChangeFile, Config } from "../types";
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
export declare function sortChanges(changes: ChangeFile[], ordering?: Config["ordering"]): ChangeFile[];
//# sourceMappingURL=sorting.d.ts.map