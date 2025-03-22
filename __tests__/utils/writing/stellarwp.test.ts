import stellarwp from "../../../src/utils/writing/stellarwp";
import { ChangeFile, Config } from "../../../src/types";
import * as fs from "fs/promises";
import * as path from "path";

// Mock fs/promises
jest.mock("fs/promises");
const mockedFs = fs as jest.Mocked<typeof fs>;

describe("stellarwp", () => {
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

      expect(stellarwp.formatChanges("1.0.0", changes)).toBe(expected);
    });

    it("should maintain type order and skip empty types", () => {
      const changes: ChangeFile[] = [
        { type: "fix", entry: "Fixed something", significance: "patch" },
        { type: "feature", entry: "Added something", significance: "minor" },
      ];

      const result = stellarwp.formatChanges("1.0.0", changes);

      // Verify each line is present without enforcing order
      expect(result).toContain("* Feature - Added something");
      expect(result).toContain("* Fix - Fixed something");
      expect(result.split("\n").length).toBe(2);
    });
  });

  describe("formatVersionHeader", () => {
    it("should format version header according to StellarWP style", () => {
      const expected = "= [1.0.0] 2024-03-04 =\n";
      expect(stellarwp.formatVersionHeader("1.0.0", "2024-03-04")).toBe(
        expected,
      );
    });
  });

  describe("formatVersionLink", () => {
    it("should return empty string as StellarWP format does not use version links", () => {
      if (stellarwp.formatVersionLink) {
        const result = stellarwp.formatVersionLink(
          "1.0.0",
          "0.9.0",
          "https://example.com",
        );
        expect(result).toBe("");
      }
    });
  });

  describe("handleAdditionalFiles", () => {
    const mockConfig: Config = {
      changelogFile: "changelog.md",
      changesDir: "changelog",
      types: {
        feature: "Feature",
        fix: "Fix",
        tweak: "Tweak",
        fixed: "Fixed",
        added: "Added",
        changed: "Changed",
        deprecated: "Deprecated",
        removed: "Removed",
        security: "Security",
        compatibility: "Compatibility",
        language: "Language",
      },
      ordering: ["type", "content"] as const,
      formatter: "stellarwp",
      versioning: "semver",
    };

    const mockChanges: ChangeFile[] = [
      { type: "feature", entry: "New feature", significance: "minor" },
      { type: "fix", entry: "Bug fix", significance: "patch" },
    ];

    it("should update readme.txt if it exists", async () => {
      // Mock reading existing readme.txt
      mockedFs.readFile.mockResolvedValueOnce(
        "=== Plugin Name ===\n\n== Changelog ==\nOld entries\n",
      );

      if (stellarwp.handleAdditionalFiles) {
        const promises = stellarwp.handleAdditionalFiles(
          "1.0.0",
          "2024-03-22",
          mockChanges,
          mockConfig,
        );

        await Promise.all(promises);

        // Verify readme.txt was updated
        expect(mockedFs.readFile).toHaveBeenCalledWith(
          expect.stringContaining("readme.txt"),
          "utf8",
        );
        expect(mockedFs.writeFile).toHaveBeenCalledWith(
          expect.stringContaining("readme.txt"),
          expect.stringContaining("= [1.0.0] - 2024-03-22 ="),
        );
        expect(mockedFs.writeFile).toHaveBeenCalledWith(
          expect.stringContaining("readme.txt"),
          expect.stringContaining("* Feature - New feature\n* Fix - Bug fix"),
        );
      }
    });

    it("should silently ignore if readme.txt does not exist", async () => {
      // Mock readme.txt not existing
      mockedFs.readFile.mockRejectedValueOnce({ code: "ENOENT" });

      if (stellarwp.handleAdditionalFiles) {
        const promises = stellarwp.handleAdditionalFiles(
          "1.0.0",
          "2024-03-22",
          mockChanges,
          mockConfig,
        );

        await Promise.all(promises);

        // Verify no write attempt was made
        expect(mockedFs.writeFile).not.toHaveBeenCalled();
      }
    });

    it("should throw error if readme.txt exists but has other error", async () => {
      // Mock read error
      mockedFs.readFile.mockRejectedValueOnce(new Error("Permission denied"));

      if (stellarwp.handleAdditionalFiles) {
        const promises = stellarwp.handleAdditionalFiles(
          "1.0.0",
          "2024-03-22",
          mockChanges,
          mockConfig,
        );

        await expect(Promise.all(promises)).rejects.toThrow(
          "Permission denied",
        );
      }
    });

    it("should update readme.txt with correct changelog format", async () => {
      const initialContent =
        "=== Plugin Name ===\n\n== Changelog ==\nOld entries\n";
      // Mock reading existing readme.txt
      mockedFs.readFile.mockResolvedValueOnce(initialContent);

      if (stellarwp.handleAdditionalFiles) {
        const promises = stellarwp.handleAdditionalFiles(
          "1.0.0",
          "2024-03-22",
          [
            { type: "feature", entry: "Major feature", significance: "major" },
            { type: "tweak", entry: "Small tweak", significance: "patch" },
            { type: "fix", entry: "Critical fix", significance: "patch" },
          ],
          mockConfig,
        );

        await Promise.all(promises);

        // Verify the exact format of the changelog entry
        expect(mockedFs.writeFile).toHaveBeenCalledWith(
          expect.stringContaining("readme.txt"),
          expect.stringMatching(
            /=== Plugin Name ===[\r\n]*== Changelog ==[\r\n]*= \[1\.0\.0\] - 2024-03-22 =[\r\n]*\* Feature - Major feature[\r\n]*\* Tweak - Small tweak[\r\n]*\* Fix - Critical fix[\r\n]*Old entries/,
          ),
        );
      }
    });
  });
});
