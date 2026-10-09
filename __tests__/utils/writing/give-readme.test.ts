import giveReadme from "../../../src/utils/writing/give-readme";
import { ChangeFile } from "../../../src/types";

describe("give-readme", () => {
  describe("formatChanges", () => {
    it("should format changes as `* Label: entry`, grouped by type", () => {
      const changes: ChangeFile[] = [
        { type: "feature", entry: "Added a donation form goal", significance: "minor" },
        { type: "fix", entry: "Fixed a rounding issue", significance: "patch" },
        { type: "feature", entry: "Added a campaign filter", significance: "minor" },
      ];

      expect(giveReadme.formatChanges("1.0.0", changes)).toBe(
        ["* Feature: Added a donation form goal", "* Feature: Added a campaign filter", "* Fix: Fixed a rounding issue"].join("\n")
      );
    });
  });

  describe("formatVersionHeader", () => {
    it("should write the date out with an ordinal day, and no blank line before the entries", () => {
      expect(giveReadme.formatVersionHeader("4.18.0", "2026-10-01")).toBe("\n= 4.18.0: October 1st, 2026 =\n");
    });

    it.each([
      ["2026-06-01", "June 1st, 2026"],
      ["2026-06-02", "June 2nd, 2026"],
      ["2026-06-03", "June 3rd, 2026"],
      ["2026-06-04", "June 4th, 2026"],
      ["2026-06-11", "June 11th, 2026"],
      ["2026-06-12", "June 12th, 2026"],
      ["2026-06-13", "June 13th, 2026"],
      ["2026-06-21", "June 21st, 2026"],
      ["2026-06-22", "June 22nd, 2026"],
      ["2026-06-23", "June 23rd, 2026"],
      ["2026-06-30", "June 30th, 2026"],
    ])("should write %s as %s", (date, written) => {
      expect(giveReadme.formatVersionHeader("1.0.0", date)).toBe(`\n= 1.0.0: ${written} =\n`);
    });

    it("should keep a date that is not YYYY-MM-DD as given", () => {
      expect(giveReadme.formatVersionHeader("1.0.0", "TBD")).toBe("\n= 1.0.0: TBD =\n");
    });
  });

  describe("formatVersionLink", () => {
    it("should return an empty string, as the format has no version links", () => {
      expect(giveReadme.formatVersionLink?.("1.0.0", "0.9.0", "https://example.com")).toBe("");
    });
  });

  describe("versionHeaderMatcher", () => {
    it("should match the header of the version", () => {
      const content = "== Changelog ==\n= 4.18.0.1: October 6th, 2026 =\n* Fix: A\n";
      expect(giveReadme.versionHeaderMatcher(content, "4.18.0.1")).toBe("= 4.18.0.1: October 6th, 2026 =");
    });

    it("should not match another version", () => {
      const content = "= 4.18.0.1: October 6th, 2026 =\n";
      expect(giveReadme.versionHeaderMatcher(content, "4.18.0")).toBeUndefined();
    });

    it("should treat regular expression metacharacters as literal characters", () => {
      const content = "= 1.0.0: March 4th, 2024 =\n";
      expect(giveReadme.versionHeaderMatcher(content, ".*")).toBeUndefined();
      expect(giveReadme.versionHeaderMatcher(content, "1x0x0")).toBeUndefined();
    });
  });

  describe("changelogHeaderMatcher", () => {
    it("should find the first version header", () => {
      const content = "== Changelog ==\n= 1.0.0: March 4th, 2024 =\n";
      expect(giveReadme.changelogHeaderMatcher(content)).toBe(16);
    });

    it("should find the position after the main header when no version header exists", () => {
      expect(giveReadme.changelogHeaderMatcher("== Changelog ==\n")).toBe(16);
    });

    it("should return 0 when no headers are found", () => {
      expect(giveReadme.changelogHeaderMatcher("Some content without headers\n")).toBe(0);
    });

    it("should not match from a readme section heading above the changelog", () => {
      // The header patterns have to stay on one line: across lines, a heading such as
      // "= Updating =" matched all the way down to the first version header.
      const content = "= Updating =\n\nUpdate as usual.\n\n== Changelog ==\n= 1.0.0: March 4th, 2024 =\n* Fix: Old entry\n";
      expect(content.slice(giveReadme.changelogHeaderMatcher(content))).toMatch(/^= 1\.0\.0: March 4th, 2024 =/);
    });
  });

  describe("getLatestVersion", () => {
    it("should return the version of the first version header", () => {
      const content = "== Changelog ==\n= 1.1.0: March 22nd, 2024 =\n* Feature: A\n\n= 1.0.0: March 20th, 2024 =\n";
      expect(giveReadme.getLatestVersion(content)).toBe("1.1.0");
    });

    it("should return undefined when no version header exists", () => {
      expect(giveReadme.getLatestVersion("== Changelog ==\n\nNo releases yet.\n")).toBeUndefined();
    });

    it("should not read a readme section heading above the changelog as a version", () => {
      const content = "= Updating =\n\nUpdate as usual.\n\n== Changelog ==\n= 1.0.0: March 4th, 2024 =\n";
      expect(giveReadme.getLatestVersion(content)).toBe("1.0.0");
    });

    it("should only return versions that versionHeaderMatcher can find again", () => {
      const content = "== Changelog ==\n= 4.18.0.1: October 6th, 2026 =\n";
      const version = giveReadme.getLatestVersion(content);
      expect(version).toBeDefined();
      expect(giveReadme.versionHeaderMatcher(content, version as string)).toBe("= 4.18.0.1: October 6th, 2026 =");
    });
  });
});
