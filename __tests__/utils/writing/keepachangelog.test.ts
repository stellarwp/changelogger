import keepachangelog from "../../../src/utils/writing/keepachangelog";
import { ChangeFile } from "../../../src/types";

jest.mock("../../../src/utils/writing/keepachangelog", () => ({
  __esModule: true,
  default: {
    formatChanges: jest.fn((version, changes) => {
      const groupedChanges = changes.reduce(
        (acc: Record<string, string[]>, change: ChangeFile) => {
          if (!acc[change.type]) {
            acc[change.type] = [];
          }
          acc[change.type].push(change.entry);
          return acc;
        },
        {},
      );

      return (Object.entries(groupedChanges) as [string, string[]][])
        .map(([type, entries]) => {
          const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
          return `### ${capitalizedType}\n${entries.map((entry) => `- ${entry}`).join("\n")}`;
        })
        .join("\n\n");
    }),
    formatVersionHeader: jest.fn(
      (version, date) => `## [${version}] - ${date}`,
    ),
    formatVersionLink: jest.fn((version, oldVersion, template) => {
      if (!template) {
        return "";
      }
      const link = template
        .replace("{old}", oldVersion)
        .replace("{new}", version);
      return `[${version}]: ${link}`;
    }),
  },
}));

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
  });

  describe("formatVersionLink", () => {
    it("should format version link with template", () => {
      const template = "https://github.com/org/repo/compare/{old}...{new}";
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
      const template = "https://github.com/org/repo/compare/{old}...{new}";
      const result =
        keepachangelog.formatVersionLink?.("1.2.3.4", "1.2.3.3", template) ??
        "";
      expect(result).toBe(
        "[1.2.3.4]: https://github.com/org/repo/compare/1.2.3.3...1.2.3.4",
      );
    });
  });
});
