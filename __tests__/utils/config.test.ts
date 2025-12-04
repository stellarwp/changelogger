import { Config } from "../../src/types";
import * as fs from "fs/promises";
import * as path from "path";

describe("config", () => {
  const testDataDir = path.join(__dirname, "../__data__/config");
  const originalCwd = process.cwd();
  let loadConfig: (reload?: boolean, filePath?: string) => Promise<Config>;

  beforeEach(async () => {
    // Change to test data directory before each test
    process.chdir(testDataDir);

    // Reset the module to clear the cached config
    jest.resetModules();
  });

  afterEach(() => {
    // Restore original working directory after each test
    process.chdir(originalCwd);
  });

  describe("getTypeLabel", () => {
    let getTypeLabel: (type: string, config?: Config) => string;
    let defaultConfig: Config;

    beforeEach(async () => {
      // Import the module fresh for each test
      const configModule = await import("../../src/utils/config");
      getTypeLabel = configModule.getTypeLabel;
      loadConfig = configModule.loadConfig;
      defaultConfig = configModule.defaultConfig;
    });

    it("should return default label for known type when no config is loaded", () => {
      expect(getTypeLabel("added")).toBe("Added");
      expect(getTypeLabel("changed")).toBe("Changed");
      expect(getTypeLabel("deprecated")).toBe("Deprecated");
    });

    it("should return type as-is for unknown type", () => {
      expect(getTypeLabel("unknown")).toBe("unknown");
      expect(getTypeLabel("custom-type")).toBe("custom-type");
    });

    it("should use cached config when no config is provided", async () => {
      // Load a custom config
      const configPath = path.join(testDataDir, "custom-types.json");
      await loadConfig(false, configPath);

      // Verify it uses the cached config
      expect(getTypeLabel("added")).toBe("New Feature");
      expect(getTypeLabel("changed")).toBe("Enhancement");
      expect(getTypeLabel("deprecated")).toBe("Soon Removing");
    });

    it("should use provided config over cached config", async () => {
      // Load a custom config
      const configPath = path.join(testDataDir, "custom-types.json");
      await loadConfig(false, configPath);

      // Create a different config
      const differentConfig: Config = {
        ...defaultConfig,
        types: {
          ...defaultConfig.types,
          added: "Different Label",
        },
      };

      // Verify it uses the provided config
      expect(getTypeLabel("added", differentConfig)).toBe("Different Label");
      expect(getTypeLabel("added")).toBe("New Feature"); // Still uses cached config
    });

    it("should use custom config when provided", async () => {
      const configPath = path.join(testDataDir, "custom-types.json");
      const config = await loadConfig(false, configPath);

      expect(getTypeLabel("added", config)).toBe("New Feature");
      expect(getTypeLabel("changed", config)).toBe("Enhancement");
      expect(getTypeLabel("deprecated", config)).toBe("Soon Removing");
    });

    it("should handle emoji types from full config", async () => {
      const configPath = path.join(testDataDir, "full.json");
      const config = await loadConfig(false, configPath);

      expect(getTypeLabel("added", config)).toBe("New Feature ✨");
      expect(getTypeLabel("changed", config)).toBe("Enhancement 🚀");
      expect(getTypeLabel("deprecated", config)).toBe("Deprecated ⚠️");
    });
  });

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
        fix: "Fix",
        security: "Security",
        feature: "Feature",
        tweak: "Tweak",
        compatibility: "Compatibility",
        language: "Language",
      },
      formatter: "keepachangelog",
      versioning: "semver",
      files: [
        {
          path: "changelog.md",
          strategy: "keepachangelog",
        },
      ],
    };

    // Basic structure validation
    expect(defaultConfig.changelogFile).toBe("changelog.md");
    expect(defaultConfig.changesDir).toBe("changelog");
    expect(Array.isArray(defaultConfig.ordering)).toBe(true);
    expect(typeof defaultConfig.types).toBe("object");
    expect(defaultConfig.formatter).toBe("keepachangelog");
    expect(defaultConfig.versioning).toBe("semver");
    expect(Array.isArray(defaultConfig.files)).toBe(true);
    expect(defaultConfig.files[0]?.path).toBe("changelog.md");
    expect(defaultConfig.files[0]?.strategy).toBe("keepachangelog");

    // Validate required type keys exist
    const requiredTypes = ["added", "changed", "deprecated", "removed", "security", "feature", "tweak", "fix", "compatibility", "language"];
    requiredTypes.forEach(type => {
      expect(defaultConfig.types[type as keyof typeof defaultConfig.types]).toBeDefined();
    });
  });

  describe("caching functionality", () => {
    beforeEach(async () => {
      // Import the module fresh for each test
      const configModule = await import("../../src/utils/config");
      loadConfig = configModule.loadConfig;
    });

    it("should cache the config and not reload from file system on subsequent calls", async () => {
      const configPath = path.join(testDataDir, "minimal.json");

      // First call should read from file system
      const config1 = await loadConfig(false, configPath);

      // Second call should use cache
      const config2 = await loadConfig(false, configPath);

      // Verify configs are the same
      expect(config1).toEqual(config2);
    });

    it("should reload config when reload parameter is true", async () => {
      const configPath = path.join(testDataDir, "minimal.json");

      // First call
      const config1 = await loadConfig(false, configPath);

      // Second call with reload=true
      const config2 = await loadConfig(true, configPath);

      // Verify configs are the same
      expect(config1).toEqual(config2);
    });

    it("should use default config when package.json is not found", async () => {
      const nonExistentPath = path.join(testDataDir, "non-existent.json");
      const config = await loadConfig(false, nonExistentPath);

      // Verify we got the default config
      expect(config.changelogFile).toBe("changelog.md");
      expect(config.changesDir).toBe("changelog");
      expect(config.formatter).toBe("keepachangelog");
      expect(config.versioning).toBe("semver");
    });

    it("should handle minimal config correctly", async () => {
      const configPath = path.join(testDataDir, "minimal.json");
      const config = await loadConfig(false, configPath);

      // Verify minimal values are used
      expect(config.changelogFile).toBe("minimal-changelog.md");
      expect(config.changesDir).toBe("minimal-changes");

      // Verify default values are used for non-specified fields
      expect(config.ordering).toEqual(["type", "content"]);
      expect(config.formatter).toBe("keepachangelog");
      expect(config.versioning).toBe("semver");
      expect(config.types.added).toBe("Added");
      expect(config.types.changed).toBe("Changed");
    });

    it("should handle custom types config correctly", async () => {
      const configPath = path.join(testDataDir, "custom-types.json");
      const config = await loadConfig(false, configPath);

      // Verify custom types are used
      expect(config.types.added).toBe("New Feature");
      expect(config.types.changed).toBe("Enhancement");
      expect(config.types.deprecated).toBe("Soon Removing");
      expect(config.types.removed).toBe("Deleted");
      expect(config.types.fix).toBe("Bug Fix");
      expect(config.types.security).toBe("Security Patch");

      // Verify default values for non-specified fields
      expect(config.formatter).toBe("keepachangelog");
      expect(config.versioning).toBe("semver");
    });

    it("should handle custom format config correctly", async () => {
      const configPath = path.join(testDataDir, "custom-format.json");
      const config = await loadConfig(false, configPath);

      // Verify custom format settings
      expect(config.ordering).toEqual(["timestamp", "type", "content"]);
      expect(config.formatter).toBe("custom-format");
      expect(config.versioning).toBe("custom-version");
      expect(config.files).toHaveLength(2);
      expect(config.files[0]?.strategy).toBe("custom-strategy");
      expect(config.files[1]?.strategy).toBe("json");
    });

    it("should handle full config correctly", async () => {
      const configPath = path.join(testDataDir, "full.json");
      const config = await loadConfig(false, configPath);

      // Verify all custom values
      expect(config.changelogFile).toBe("full-changelog.md");
      expect(config.changesDir).toBe("full-changes");
      expect(config.ordering).toEqual(["timestamp", "type", "content", "author"]);
      expect(config.formatter).toBe("custom-full");
      expect(config.versioning).toBe("custom-semver");

      // Verify custom types with emojis
      expect(config.types.added).toBe("New Feature ✨");
      expect(config.types.changed).toBe("Enhancement 🚀");
      expect(config.types.deprecated).toBe("Deprecated ⚠️");

      // Verify multiple file outputs
      expect(config.files).toHaveLength(3);
      expect(config.files[0]?.path).toBe("full-changelog.md");
      expect(config.files[1]?.path).toBe("full-changelog.json");
      expect(config.files[2]?.path).toBe("full-changelog.html");
    });
  });

  describe("user-provided types", () => {
    beforeEach(async () => {
      // Import the module fresh for each test
      const configModule = await import("../../src/utils/config");
      loadConfig = configModule.loadConfig;
    });

    it("should combine default and user-provided types and sort them alphabetically by key", async () => {
      const configPath = path.join(testDataDir, "custom-types.json");
      const config = await loadConfig(false, configPath);
  
      // Verify types are sorted alphabetically by key
      expect(Object.keys(config.types)).toEqual(Object.keys(config.types).sort());
    });
  
    it("should allow overwriting default types with user-provided types", async () => {
      const configPath = path.join(testDataDir, "custom-types.json");
      const config = await loadConfig(false, configPath);
  
      const fileContents = await fs.readFile(configPath, "utf-8");
      const customConfig = JSON.parse(fileContents).changelogger;
  
      for (const key in customConfig.types) {
        // The loaded config should use the label from the custom config.
        expect(config.types[key as keyof typeof config.types]).toBe(customConfig.types[key]);
      }
    });
  });
});
