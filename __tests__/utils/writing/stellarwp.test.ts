import stellarwp from "../../../src/utils/writing/stellarwp";
import { ChangeFile } from "../../../src/types";

describe("stellarwp", () => {
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
        "* Language - 0 new strings added, 0 updated, 0 fuzzied, and 0 obsoleted.",
      ].join("\n");

      expect(stellarwp.formatChanges("1.0.0", changes)).toBe(expected);
    });

    it("should maintain type order and skip empty types", () => {
      const changes: ChangeFile[] = [
        { type: "fix", entry: "Fixed something", significance: "patch" },
        { type: "feature", entry: "Added something", significance: "minor" },
      ];

      const expected = [
        "* Feature - Added something",
        "* Fix - Fixed something",
        "* Language - 0 new strings added, 0 updated, 0 fuzzied, and 0 obsoleted.",
      ].join("\n");

      expect(stellarwp.formatChanges("1.0.0", changes)).toBe(expected);
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
});
