import keepachangelog from "../../../src/utils/writing/keepachangelog";
import { ChangeFile } from "../../../src/types";

describe("Keep a Changelog Writing Strategy", () => {
  describe("formatChanges", () => {
    it("should group changes by type", () => {
      const changes: ChangeFile[] = [
        { type: "added", entry: "Feature A", significance: "minor" },
        { type: "fixed", entry: "Bug fix B", significance: "patch" },
        { type: "added", entry: "Feature C", significance: "minor" },
      ];

      const result = keepachangelog.formatChanges("1.0.0", changes);
      expect(result).toContain("### Added\n- Feature A\n- Feature C");
      expect(result).toContain("### Fixed\n- Bug fix B");
    });

    it("should capitalize type names", () => {
      const changes: ChangeFile[] = [
        { type: "added", entry: "Feature A", significance: "minor" },
      ];

      const result = keepachangelog.formatChanges("1.0.0", changes);
      expect(result).toContain("### Added");
    });

    it("should handle empty changes array", () => {
      const result = keepachangelog.formatChanges("1.0.0", []);
      expect(result).toBe("");
    });

    it("should preserve entry formatting", () => {
      const changes: ChangeFile[] = [
        {
          type: "added",
          entry: "**Bold** and _italic_ text",
          significance: "minor",
        },
      ];

      const result = keepachangelog.formatChanges("1.0.0", changes);
      expect(result).toContain("- **Bold** and _italic_ text");
    });

    it("should handle multiple entries of different types", () => {
      const changes: ChangeFile[] = [
        { type: "added", entry: "Feature A", significance: "minor" },
        { type: "changed", entry: "Change B", significance: "minor" },
        { type: "deprecated", entry: "Deprecation C", significance: "minor" },
        { type: "removed", entry: "Removal D", significance: "major" },
        { type: "fixed", entry: "Fix E", significance: "patch" },
        { type: "security", entry: "Security F", significance: "patch" },
      ];

      const result = keepachangelog.formatChanges("1.0.0", changes);
      expect(result).toContain("### Added\n- Feature A");
      expect(result).toContain("### Changed\n- Change B");
      expect(result).toContain("### Deprecated\n- Deprecation C");
      expect(result).toContain("### Removed\n- Removal D");
      expect(result).toContain("### Fixed\n- Fix E");
      expect(result).toContain("### Security\n- Security F");
    });
  });

  describe("formatVersionHeader", () => {
    it("should format version header with date", () => {
      const result = keepachangelog.formatVersionHeader("1.0.0", "2024-03-20");
      expect(result).toBe("## [1.0.0] - 2024-03-20");
    });

    it("should handle versions with hotfixes", () => {
      const result = keepachangelog.formatVersionHeader(
        "1.0.0.1",
        "2024-03-20",
      );
      expect(result).toBe("## [1.0.0.1] - 2024-03-20");
    });

    it("should handle previous version parameter", () => {
      const result = keepachangelog.formatVersionHeader(
        "2.0.0",
        "2024-03-20",
        "1.0.0",
      );
      expect(result).toBe("## [2.0.0] - 2024-03-20");
    });
  });

  describe("formatVersionLink", () => {
    it("should format version link with template", () => {
      const template = "https://github.com/org/repo/compare/${old}...${new}";
      const result =
        keepachangelog.formatVersionLink?.("1.2.3", "1.2.2", template) ?? "";
      expect(result).toBe(
        "[1.2.3]: https://github.com/org/repo/compare/1.2.2...1.2.3",
      );
    });

    it("should return empty string when no template is provided", () => {
      const result = keepachangelog.formatVersionLink?.("1.2.3", "1.2.2") ?? "";
      expect(result).toBe("");
    });

    it("should handle versions with hotfixes", () => {
      const template = "https://github.com/org/repo/compare/${old}...${new}";
      const result =
        keepachangelog.formatVersionLink?.("1.2.3.4", "1.2.3.3", template) ??
        "";
      expect(result).toBe(
        "[1.2.3.4]: https://github.com/org/repo/compare/1.2.3.3...1.2.3.4",
      );
    });
  });
});
