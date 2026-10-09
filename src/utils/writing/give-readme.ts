import { ChangeFile } from "../../types";
import { getTypeLabel } from "../config";
import { escapeRegExp, WritingStrategy } from "../writing";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/**
 * The English ordinal suffix of a day of the month: 1st, 2nd, 3rd, 4th, 11th, 21st.
 *
 * @param day - The day of the month
 *
 * @returns The suffix
 */
function ordinalSuffix(day: number): string {
  const lastTwo = day % 100;
  if (lastTwo >= 11 && lastTwo <= 13) {
    return "th";
  }

  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

/**
 * Writes a YYYY-MM-DD date out the way Give's changelogs do: `2026-06-02` becomes `June 2nd, 2026`.
 * Any other value is kept as given.
 *
 * @param date - The release date
 *
 * @returns The date as it appears in the version header
 */
function formatDate(date: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) {
    return date;
  }

  const [, year, month, day] = match;
  const dayNumber = Number(day);

  return `${MONTHS[Number(month) - 1]} ${dayNumber}${ordinalSuffix(dayNumber)}, ${year}`;
}

/**
 * Give's changelog format, used in the `readme.txt` and `changelog.txt` of Give and its add-ons:
 *
 * ```text
 * = 4.18.0: October 1st, 2026 =
 * * Feature: Added a sample donation widget
 * * Fix: Resolved a rounding issue in donation totals
 * ```
 *
 * The version header has no brackets and writes the date out, so the changelogger's automatic
 * versioning can't read it; pass the version to `write` with `--overwrite-version`.
 *
 * The header patterns exclude `\n` from their character classes so that a match stays on one line.
 * Otherwise a readme section heading such as `= Updating =` matches across lines down to the first
 * version header, and the new version is written above `== Changelog ==`.
 */
const giveReadme: WritingStrategy = {
  formatChanges(version: string, changes: ChangeFile[]): string {
    const groupedChanges = changes.reduce(
      (acc, change) => {
        if (!acc[change.type]) {
          acc[change.type] = [];
        }
        acc[change.type]?.push(change.entry);
        return acc;
      },
      {} as Record<string, string[]>
    );

    return Object.entries(groupedChanges)
      .map(([type, entries]) => {
        const label = getTypeLabel(type, "give-readme");
        return entries.map(entry => `* ${label}: ${entry}`).join("\n");
      })
      .filter(section => section.length > 0)
      .join("\n");
  },

  // A single trailing newline keeps the entries directly under the header, with no blank line.
  formatVersionHeader(version: string, date: string): string {
    return `\n= ${version}: ${formatDate(date)} =\n`;
  },

  formatVersionLink(): string {
    return "";
  },

  versionHeaderMatcher(content: string, version: string): string | undefined {
    const versionRegex = new RegExp(`^(= ${escapeRegExp(version)}: [^=\\n]+ =)$`, "m");
    const match = content.match(versionRegex);
    return match ? match[1]?.trim() : undefined;
  },

  changelogHeaderMatcher(content: string): number {
    // Before the first existing version block, or right after `== Changelog ==` when there is none.
    const firstVersionMatch = content.match(/^= [^:\n]+: [^=\n]+ =$/m);
    if (!firstVersionMatch) {
      const mainHeaderMatch = content.match(/^== Changelog ==$/m);
      return mainHeaderMatch ? mainHeaderMatch.index! + mainHeaderMatch[0].length + 1 : 0;
    }
    return firstVersionMatch.index!;
  },

  getLatestVersion(content: string): string | undefined {
    // The same header grammar as versionHeaderMatcher, so every version this returns can be found again.
    const match = content.match(/^= ([^:\n]+): [^=\n]+ =$/m);
    return match?.[1]?.trim();
  },
};

export default giveReadme;
