import { Config } from "../../src/types";

describe("config", () => {
  it("should have valid default config structure", () => {
    const defaultConfig: Config = {
      changelogFile: "changelog.md",
      changesDir: "changelog",
      ordering: ["type", "content"],
      types: {
        added: "Added",
        changed: "Changed",
        deprecated: "Deprecated",
        removed: "Removed",
        fixed: "Fixed",
        security: "Security",
        feature: "Feature",
        tweak: "Tweak",
        fix: "Fix",
        compatibility: "Compatibility",
        language: "Language",
      },
      formatter: "keepachangelog",
      versioning: "semver",
    };

    // Basic structure validation
    expect(defaultConfig.changelogFile).toBe("changelog.md");
    expect(defaultConfig.changesDir).toBe("changelog");
    expect(Array.isArray(defaultConfig.ordering)).toBe(true);
    expect(typeof defaultConfig.types).toBe("object");
    expect(defaultConfig.formatter).toBe("keepachangelog");
    expect(defaultConfig.versioning).toBe("semver");

    // Validate required type keys exist
    const requiredTypes = [
      "added",
      "changed",
      "deprecated",
      "removed",
      "fixed",
      "security",
      "feature",
      "tweak",
      "fix",
      "compatibility",
      "language",
    ];
    requiredTypes.forEach((type) => {
      expect(
        defaultConfig.types[type as keyof typeof defaultConfig.types],
      ).toBeDefined();
    });
  });
});
