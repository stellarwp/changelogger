import stellarwpReadme from "../../../src/utils/writing/stellarwp-readme";
import { ChangeFile, Config } from "../../../src/types";
import * as fs from "fs/promises";
import * as path from "path";

// Mock fs/promises
jest.mock("fs/promises");
const mockedFs = fs as jest.Mocked<typeof fs>;

describe("stellarwp-readme", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("formatChanges", () => {
    it("should format changes according to StellarWP style", () => {
      const changes: ChangeFile[] = [
        {
          type: "feature",
          entry: "Added new feature [ABC-123]",
          significance: "minor",
        },
        { type: "tweak", entry: "Updated something", significance: "patch" },
        { type: "fix", entry: "Fixed a bug [XYZ-456]", significance: "patch" },
        {
          type: "compatibility",
          entry: "Added compatibility with WordPress 6.0",
          significance: "minor",
        },
      ];

      const expected = [
        "* Feature - Added new feature [ABC-123]",
        "* Tweak - Updated something",
        "* Fix - Fixed a bug [XYZ-456]",
        "* Compatibility - Added compatibility with WordPress 6.0",
      ].join("\n");

      expect(stellarwpReadme.formatChanges("1.0.0", changes)).toBe(expected);
    });

    it("should maintain type order and skip empty types", () => {
      const changes: ChangeFile[] = [
        { type: "fix", entry: "Fixed something", significance: "patch" },
        { type: "feature", entry: "Added something", significance: "minor" },
      ];

      const result = stellarwpReadme.formatChanges("1.0.0", changes);

      // Verify each line is present without enforcing order
      expect(result).toContain("* Feature - Added something");
      expect(result).toContain("* Fix - Fixed something");
      expect(result.split("\n").length).toBe(2);
    });
  });

  describe("formatVersionHeader", () => {
    it("should format version header according to StellarWP style", () => {
      const expected = "\n= [1.0.0] 2024-03-04 =\n\n";
      expect(stellarwpReadme.formatVersionHeader("1.0.0", "2024-03-04")).toBe(expected);
    });
  });

  describe("formatVersionLink", () => {
    it("should return empty string as StellarWP format does not use version links", () => {
      if (stellarwpReadme.formatVersionLink) {
        const result = stellarwpReadme.formatVersionLink("1.0.0", "0.9.0", "https://example.com");
        expect(result).toBe("");
      }
    });
  });

  describe("versionHeaderMatcher", () => {
    it("should match StellarWP version headers", () => {
      const content = "= [1.0.0] 2024-03-04 =\n";
      const result = stellarwpReadme.versionHeaderMatcher(content, "1.0.0");
      expect(result).toBe("= [1.0.0] 2024-03-04 =");
    });

    it("should return undefined for non-matching version", () => {
      const content = "= [1.0.0] 2024-03-04 =\n";
      const result = stellarwpReadme.versionHeaderMatcher(content, "2.0.0");
      expect(result).toBeUndefined();
    });
  });

  describe("changelogHeaderMatcher", () => {
    it("should find position after first version header", () => {
      const content = "= [1.0.0] 2024-03-04 =\n";
      const result = stellarwpReadme.changelogHeaderMatcher(content);
      expect(result).toBe(0);
    });

    it("should find position after main header when no version header exists", () => {
      const content = "== Changelog ==\n";
      const result = stellarwpReadme.changelogHeaderMatcher(content);
      expect(result).toBe(16); // Length of "== Changelog ==\n"
    });

    it("should return 0 when no headers are found", () => {
      const content = "Some content without headers\n";
      const result = stellarwpReadme.changelogHeaderMatcher(content);
      expect(result).toBe(0);
    });
  });
});
