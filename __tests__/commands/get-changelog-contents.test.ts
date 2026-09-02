import { run } from "../../src/commands/get-changelog-contents";
import * as fs from "fs/promises";
import { loadConfig } from "../../src/utils/config";
import { Config, GetChangelogContentsOptions } from "../../src/types";
import { PathLike } from "fs";
import { FileHandle } from "fs/promises";

jest.mock("fs/promises");
jest.mock("../../src/utils/config");

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedLoadConfig = loadConfig as jest.MockedFunction<typeof loadConfig>;

const keepachangelogContent = `# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2024-03-22

### Added
- New feature A
- New feature B

### Fixed
- Bug fix C

## [1.0.0] - 2024-03-20

### Added
- Initial feature
`;

const stellarwpChangelogContent = `== Changelog ==

### [1.1.0] 2024-03-22

* Feature - New feature A
* Fix - Bug fix C

### [1.0.0] 2024-03-20

* Feature - Initial feature
`;

const stellarwpReadmeContent = `== Changelog ==

= [1.1.0] 2024-03-22 =

* Feature - New feature A
* Fix - Bug fix C

= [1.0.0] 2024-03-20 =

* Feature - Initial feature
`;

function makeConfig(overrides: Partial<Config> = {}): Config {
  return {
    changelogFile: "changelog.md",
    changesDir: "changelog",
    ordering: ["type", "content"],
    types: {
      compatibility: "Compatibility",
      deprecated: "Deprecated",
      feature: "Feature",
      fix: "Fix",
      language: "Language",
      removed: "Removed",
      security: "Security",
      tweak: "Tweak",
    },
    typeLabelOverrides: {
      keepachangelog: {
        feature: "Added",
        fix: "Fixed",
        tweak: "Changed",
      },
    },
    formatter: "keepachangelog",
    versioning: "semver",
    files: [
      {
        path: "changelog.md",
        strategy: "keepachangelog",
      },
    ],
    ...overrides,
  };
}

describe("get-changelog-contents command", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should retrieve entries for a version from a keepachangelog-formatted file", async () => {
    mockedLoadConfig.mockResolvedValue(makeConfig());
    mockedFs.readFile.mockResolvedValue(keepachangelogContent);

    const result = await run({ version: "1.1.0" });

    expect(result).toContain("### Added");
    expect(result).toContain("- New feature A");
    expect(result).toContain("- New feature B");
    expect(result).toContain("### Fixed");
    expect(result).toContain("- Bug fix C");
  });

  it("should retrieve entries for a version from a stellarwp-changelog-formatted file", async () => {
    mockedLoadConfig.mockResolvedValue(
      makeConfig({
        files: [{ path: "changelog.md", strategy: "stellarwp-changelog" }],
      })
    );
    mockedFs.readFile.mockResolvedValue(stellarwpChangelogContent);

    const result = await run({ version: "1.1.0" });

    expect(result).toContain("* Feature - New feature A");
    expect(result).toContain("* Fix - Bug fix C");
  });

  it("should retrieve entries for a version from a stellarwp-readme-formatted file", async () => {
    mockedLoadConfig.mockResolvedValue(
      makeConfig({
        files: [{ path: "readme.txt", strategy: "stellarwp-readme" }],
      })
    );
    mockedFs.readFile.mockResolvedValue(stellarwpReadmeContent);

    const result = await run({ version: "1.1.0" });

    expect(result).toContain("* Feature - New feature A");
    expect(result).toContain("* Fix - Bug fix C");
  });

  it("should return entries without the version header line", async () => {
    mockedLoadConfig.mockResolvedValue(makeConfig());
    mockedFs.readFile.mockResolvedValue(keepachangelogContent);

    const result = await run({ version: "1.1.0" });

    expect(result).not.toContain("## [1.1.0] - 2024-03-22");
  });

  it("should throw when the version is not found", async () => {
    mockedLoadConfig.mockResolvedValue(makeConfig());
    mockedFs.readFile.mockResolvedValue(keepachangelogContent);

    await expect(run({ version: "9.9.9" })).rejects.toThrow("Version 9.9.9 not found in changelog.md");
  });

  it("should throw when the file cannot be read", async () => {
    mockedLoadConfig.mockResolvedValue(makeConfig());
    mockedFs.readFile.mockRejectedValue(new Error("ENOENT: no such file or directory"));

    await expect(run({ version: "1.0.0" })).rejects.toThrow("ENOENT");
  });

  it("should use the --file option to select a specific configured file", async () => {
    mockedLoadConfig.mockResolvedValue(
      makeConfig({
        files: [
          { path: "changelog.md", strategy: "keepachangelog" },
          { path: "readme.txt", strategy: "stellarwp-readme" },
        ],
      })
    );
    mockedFs.readFile.mockResolvedValue(stellarwpReadmeContent);

    const result = await run({ version: "1.1.0", file: "readme.txt" });

    expect(mockedFs.readFile).toHaveBeenCalledWith("readme.txt", "utf8");
    expect(result).toContain("* Feature - New feature A");
  });

  it("should throw when --file does not match any configured file", async () => {
    mockedLoadConfig.mockResolvedValue(makeConfig());

    await expect(run({ version: "1.0.0", file: "nonexistent.md" })).rejects.toThrow('File "nonexistent.md" is not a configured changelog file');
  });

  it("should default to the first configured file when --file is not specified", async () => {
    mockedLoadConfig.mockResolvedValue(
      makeConfig({
        files: [
          { path: "changelog.md", strategy: "keepachangelog" },
          { path: "readme.txt", strategy: "stellarwp-readme" },
        ],
      })
    );
    mockedFs.readFile.mockResolvedValue(keepachangelogContent);

    await run({ version: "1.1.0" });

    expect(mockedFs.readFile).toHaveBeenCalledWith("changelog.md", "utf8");
  });

  it("should correctly extract content for a non-latest version", async () => {
    mockedLoadConfig.mockResolvedValue(makeConfig());
    mockedFs.readFile.mockResolvedValue(keepachangelogContent);

    const result = await run({ version: "1.0.0" });

    expect(result).toContain("### Added");
    expect(result).toContain("- Initial feature");
    // Should not contain entries from v1.1.0
    expect(result).not.toContain("- New feature A");
    expect(result).not.toContain("- Bug fix C");
  });

  it("should correctly extract content when the version is the last entry (stellarwp-changelog)", async () => {
    mockedLoadConfig.mockResolvedValue(
      makeConfig({
        files: [{ path: "changelog.md", strategy: "stellarwp-changelog" }],
      })
    );
    mockedFs.readFile.mockResolvedValue(stellarwpChangelogContent);

    const result = await run({ version: "1.0.0" });

    expect(result).toContain("* Feature - Initial feature");
    expect(result).not.toContain("* Feature - New feature A");
  });

  it("should correctly extract content when the version is the last entry (stellarwp-readme)", async () => {
    mockedLoadConfig.mockResolvedValue(
      makeConfig({
        files: [{ path: "readme.txt", strategy: "stellarwp-readme" }],
      })
    );
    mockedFs.readFile.mockResolvedValue(stellarwpReadmeContent);

    const result = await run({ version: "1.0.0" });

    expect(result).toContain("* Feature - Initial feature");
    expect(result).not.toContain("* Feature - New feature A");
  });

  it("should throw when no files are configured", async () => {
    mockedLoadConfig.mockResolvedValue(makeConfig({ files: [] }));

    await expect(run({ version: "1.0.0" })).rejects.toThrow("No files configured for changelog");
  });

  describe("version header at the end of the file", () => {
    it("should return empty entries when the header is the final line without a trailing newline", async () => {
      mockedLoadConfig.mockResolvedValue(makeConfig());
      mockedFs.readFile.mockResolvedValue("# Changelog\n\n## [1.1.0] - 2024-03-22\n\n### Added\n- New feature A\n\n## [1.0.0] - 2024-03-20");

      const result = await run({ version: "1.0.0" });

      expect(result).toBe("");
      // The entries from 1.1.0 sit before the header and must not be returned
      expect(result).not.toContain("- New feature A");
    });

    it("should return empty entries when the only header has no trailing newline", async () => {
      mockedLoadConfig.mockResolvedValue(makeConfig());
      mockedFs.readFile.mockResolvedValue("# Changelog\n\n## [1.0.0] - 2024-03-20");

      const result = await run({ version: "1.0.0" });

      expect(result).toBe("");
      expect(result).not.toContain("# Changelog");
    });
  });

  describe("regular expression metacharacters in the version", () => {
    it("should not match any version when the version is `.*` (keepachangelog)", async () => {
      mockedLoadConfig.mockResolvedValue(makeConfig());
      mockedFs.readFile.mockResolvedValue(keepachangelogContent);

      await expect(run({ version: ".*" })).rejects.toThrow("Version .* not found in changelog.md");
    });

    it("should not match any version when the version is `.*` (stellarwp-changelog)", async () => {
      mockedLoadConfig.mockResolvedValue(
        makeConfig({
          files: [{ path: "changelog.md", strategy: "stellarwp-changelog" }],
        })
      );
      mockedFs.readFile.mockResolvedValue(stellarwpChangelogContent);

      await expect(run({ version: ".*" })).rejects.toThrow("Version .* not found in changelog.md");
    });

    it("should not match any version when the version is `.*` (stellarwp-readme)", async () => {
      mockedLoadConfig.mockResolvedValue(
        makeConfig({
          files: [{ path: "readme.txt", strategy: "stellarwp-readme" }],
        })
      );
      mockedFs.readFile.mockResolvedValue(stellarwpReadmeContent);

      await expect(run({ version: ".*" })).rejects.toThrow("Version .* not found in readme.txt");
    });

    it("should treat `.` in a version as a literal character", async () => {
      mockedLoadConfig.mockResolvedValue(makeConfig());
      mockedFs.readFile.mockResolvedValue(keepachangelogContent);

      // `1x1x0` would match `1.1.0` if the dots were left unescaped.
      await expect(run({ version: "1x1x0" })).rejects.toThrow("Version 1x1x0 not found in changelog.md");
    });
  });

  describe("--last option", () => {
    it("should retrieve entries for the latest version from a keepachangelog-formatted file", async () => {
      mockedLoadConfig.mockResolvedValue(makeConfig());
      mockedFs.readFile.mockResolvedValue(keepachangelogContent);

      const result = await run({ last: true });

      expect(result).toContain("### Added");
      expect(result).toContain("- New feature A");
      expect(result).toContain("- New feature B");
      expect(result).toContain("### Fixed");
      expect(result).toContain("- Bug fix C");
      // Should not contain entries from v1.0.0
      expect(result).not.toContain("- Initial feature");
    });

    it("should retrieve entries for the latest version from a stellarwp-changelog-formatted file", async () => {
      mockedLoadConfig.mockResolvedValue(
        makeConfig({
          files: [{ path: "changelog.md", strategy: "stellarwp-changelog" }],
        })
      );
      mockedFs.readFile.mockResolvedValue(stellarwpChangelogContent);

      const result = await run({ last: true });

      expect(result).toContain("* Feature - New feature A");
      expect(result).toContain("* Fix - Bug fix C");
      expect(result).not.toContain("* Feature - Initial feature");
    });

    it("should retrieve entries for the latest version from a stellarwp-readme-formatted file", async () => {
      mockedLoadConfig.mockResolvedValue(
        makeConfig({
          files: [{ path: "readme.txt", strategy: "stellarwp-readme" }],
        })
      );
      mockedFs.readFile.mockResolvedValue(stellarwpReadmeContent);

      const result = await run({ last: true });

      expect(result).toContain("* Feature - New feature A");
      expect(result).toContain("* Fix - Bug fix C");
      expect(result).not.toContain("* Feature - Initial feature");
    });

    it("should throw when no version headers exist in the file", async () => {
      mockedLoadConfig.mockResolvedValue(makeConfig());
      mockedFs.readFile.mockResolvedValue("# Changelog\n\nNo versions yet.\n");

      await expect(run({ last: true })).rejects.toThrow("No version found in changelog.md");
    });

    it("should skip an undated Unreleased header and return the latest released version", async () => {
      mockedLoadConfig.mockResolvedValue(makeConfig());
      mockedFs.readFile.mockResolvedValue(
        "# Changelog\n\n## [Unreleased]\n\n### Added\n- Pending feature\n\n## [1.0.0] - 2024-03-20\n\n### Added\n- Initial feature\n"
      );

      const result = await run({ last: true });

      expect(result).toContain("- Initial feature");
      expect(result).not.toContain("- Pending feature");
    });

    it("should throw when both --version and --last are provided", async () => {
      await expect(run({ version: "1.0.0", last: true })).rejects.toThrow("Cannot use both --version and --last");
    });

    it("should throw when neither --version nor --last is provided", async () => {
      await expect(run({})).rejects.toThrow("Either --version or --last must be specified");
    });
  });

  describe("--html option", () => {
    it("should convert keepachangelog markdown entries to HTML", async () => {
      mockedLoadConfig.mockResolvedValue(makeConfig());
      mockedFs.readFile.mockResolvedValue(keepachangelogContent);

      const result = await run({ version: "1.1.0", html: true });

      expect(result).toContain("<h3>Added</h3>");
      expect(result).toContain("<li>New feature A</li>");
      expect(result).toContain("<li>New feature B</li>");
      expect(result).toContain("<h3>Fixed</h3>");
      expect(result).toContain("<li>Bug fix C</li>");
    });

    it("should convert stellarwp-changelog entries to HTML", async () => {
      mockedLoadConfig.mockResolvedValue(
        makeConfig({
          files: [{ path: "changelog.md", strategy: "stellarwp-changelog" }],
        })
      );
      mockedFs.readFile.mockResolvedValue(stellarwpChangelogContent);

      const result = await run({ version: "1.1.0", html: true });

      expect(result).toContain("<li>Feature - New feature A</li>");
      expect(result).toContain("<li>Fix - Bug fix C</li>");
    });

    it("should convert stellarwp-readme entries to HTML", async () => {
      mockedLoadConfig.mockResolvedValue(
        makeConfig({
          files: [{ path: "readme.txt", strategy: "stellarwp-readme" }],
        })
      );
      mockedFs.readFile.mockResolvedValue(stellarwpReadmeContent);

      const result = await run({ version: "1.1.0", html: true });

      expect(result).toContain("<li>Feature - New feature A</li>");
      expect(result).toContain("<li>Fix - Bug fix C</li>");
    });

    it("should return raw markdown when html option is not set", async () => {
      mockedLoadConfig.mockResolvedValue(makeConfig());
      mockedFs.readFile.mockResolvedValue(keepachangelogContent);

      const result = await run({ version: "1.1.0" });

      expect(result).not.toContain("<h3>");
      expect(result).not.toContain("<li>");
      expect(result).toContain("### Added");
      expect(result).toContain("- New feature A");
    });

    it("should return raw markdown when html option is false", async () => {
      mockedLoadConfig.mockResolvedValue(makeConfig());
      mockedFs.readFile.mockResolvedValue(keepachangelogContent);

      const result = await run({ version: "1.1.0", html: false });

      expect(result).not.toContain("<h3>");
      expect(result).not.toContain("<li>");
      expect(result).toContain("### Added");
    });
  });
});
