import { run } from "../../src/commands/write";
import * as fs from "fs/promises";
import * as path from "path";
import * as yaml from "yaml";
import { ChangeFile, WriteCommandOptions } from "../../src/types";
import { PathLike, ObjectEncodingOptions, OpenMode } from "fs";
import { FileHandle } from "fs/promises";
import { Abortable } from "events";

// Mock fs/promises
jest.mock("fs/promises");
const mockedFs = fs as jest.Mocked<typeof fs>;

describe("write command", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should write changelog entries correctly", async () => {
    const changeFile: ChangeFile = {
      type: "added",
      significance: "minor",
      entry: "Added new feature",
    };

    // Mock reading change files
    mockedFs.readdir.mockResolvedValue(["change1.yaml"] as any);
    mockedFs.readFile.mockImplementation(
      async (path: PathLike | FileHandle) => {
        const filePath = path.toString();
        if (filePath.endsWith("change1.yaml")) {
          return yaml.stringify(changeFile);
        }
        if (filePath.endsWith("changelog.md")) {
          return "# Change Log\n= [1.1.0] 2024-03-22 =\n* Added - Added new feature\n";
        }
        if (filePath.endsWith("changelogger.config.json")) {
          return JSON.stringify({
            formatter: "stellarwp",
            types: {
              added: "Added",
              fixed: "Fixed",
              changed: "Changed",
              feature: "Feature",
              fix: "Fix",
              tweak: "Tweak",
            },
          });
        }
        throw new Error(`Unexpected file path: ${filePath}`);
      },
    );

    const options: WriteCommandOptions = {
      version: "1.1.0",
    };

    const result = await run(options);

    expect(mockedFs.writeFile).toHaveBeenCalled();
    expect(result).toContain("Updated changelog.md to version 1.1.0");

    // Verify changelog content
    const writeCall = mockedFs.writeFile.mock.calls[0];
    const writtenContent = writeCall[1] as string;
    expect(writtenContent).toContain("= [1.1.0]");
    expect(writtenContent).toContain("* Added - Added new feature");
  });

  it("should write changelog entries correctly in Keep a Changelog format", async () => {
    const changeFile: ChangeFile = {
      type: "added",
      significance: "minor",
      entry: "Added new feature",
    };

    // Mock reading change files
    mockedFs.readdir.mockResolvedValue(["change1.yaml"] as any);
    mockedFs.readFile.mockImplementation(
      async (
        path: PathLike | FileHandle,
        options?:
          | BufferEncoding
          | (ObjectEncodingOptions &
              Abortable & { flag?: OpenMode | undefined })
          | null
          | undefined,
      ) => {
        const filePath = path.toString();
        if (filePath.endsWith("change1.yaml")) {
          return Promise.resolve(yaml.stringify(changeFile));
        }
        if (filePath.endsWith("changelog.md")) {
          return Promise.resolve(
            "# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n## [1.0.0] - 2024-03-21\n\n### Added\n- Initial feature\n",
          );
        }
        if (filePath.endsWith("changelogger.config.json")) {
          return Promise.resolve(
            JSON.stringify({
              formatter: "keepachangelog",
              types: {
                added: "Added",
                fixed: "Fixed",
                changed: "Changed",
                feature: "Feature",
                fix: "Fix",
                tweak: "Tweak",
              },
            }),
          );
        }
        throw new Error(`Unexpected file: ${filePath}`);
      },
    );

    const options: WriteCommandOptions = {
      version: "1.1.0",
    };

    const result = await run(options);

    expect(mockedFs.writeFile).toHaveBeenCalled();
    expect(result).toContain("Updated changelog.md to version 1.1.0");

    // Verify changelog content
    const writeCall = mockedFs.writeFile.mock.calls[0];
    const writtenContent = writeCall[1] as string;
    expect(writtenContent).toContain("## [1.0.0]");
    expect(writtenContent).toContain("### Added");
    expect(writtenContent).toContain("- Initial feature");
  });

  it("should write changelog entries correctly in StellarWP format", async () => {
    const changeFile: ChangeFile = {
      type: "added",
      significance: "minor",
      entry: "Added new feature",
    };

    // Mock reading change files
    mockedFs.readdir.mockResolvedValue(["change1.yaml"] as any);
    mockedFs.readFile.mockImplementation(
      async (path: PathLike | FileHandle) => {
        const filePath = path.toString();
        if (filePath.endsWith("change1.yaml")) {
          return yaml.stringify(changeFile);
        }
        if (filePath.endsWith("changelog.md")) {
          return "# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n= [1.1.0] 2024-03-22 =\n\n* Added - Added new feature\n";
        }
        if (filePath.endsWith("changelogger.config.json")) {
          return JSON.stringify({
            formatter: "stellarwp",
            types: {
              added: "Added",
              fixed: "Fixed",
              changed: "Changed",
              feature: "Feature",
              fix: "Fix",
              tweak: "Tweak",
            },
          });
        }
        return "";
      },
    );

    const options: WriteCommandOptions = {
      version: "1.1.0",
    };

    const result = await run(options);

    expect(mockedFs.writeFile).toHaveBeenCalled();
    expect(result).toContain("Updated changelog.md to version 1.1.0");

    // Verify changelog content
    const writeCall = mockedFs.writeFile.mock.calls[0];
    const writtenContent = writeCall[1] as string;
    expect(writtenContent).toContain("= [1.1.0]");
    expect(writtenContent).toContain("* Added - Added new feature");
  });

  it("should handle empty changes directory", async () => {
    mockedFs.readdir.mockResolvedValue([]);
    mockedFs.readFile.mockImplementation(
      async (path: PathLike | FileHandle) => {
        const filePath = path.toString();
        if (filePath.endsWith("changelogger.config.json")) {
          return JSON.stringify({ formatter: "stellarwp" });
        }
        return "";
      },
    );

    const options: WriteCommandOptions = {
      version: "1.1.0",
    };

    const result = await run(options);

    expect(result).toBe("No changes to write");
  });

  it("should handle non-existent changes directory", async () => {
    mockedFs.readdir.mockRejectedValue({ code: "ENOENT" });
    mockedFs.readFile.mockImplementation(
      async (path: PathLike | FileHandle) => {
        const filePath = path.toString();
        if (filePath.endsWith("changelogger.config.json")) {
          return JSON.stringify({ formatter: "stellarwp" });
        }
        return "";
      },
    );

    const options: WriteCommandOptions = {
      version: "1.1.0",
    };

    const result = await run(options);

    expect(result).toBe("No changes directory found");
  });

  it("should create changelog file if it does not exist in Keep a Changelog format", async () => {
    const changeFile: ChangeFile = {
      type: "added",
      significance: "minor",
      entry: "Added new feature",
    };

    // Mock reading change files
    mockedFs.readdir.mockResolvedValue(["change1.yaml"] as any);
    mockedFs.readFile.mockImplementation(
      async (path: PathLike | FileHandle) => {
        const filePath = path.toString();
        if (filePath.endsWith("change1.yaml")) {
          return yaml.stringify(changeFile);
        }
        if (filePath.endsWith("changelog.md")) {
          throw { code: "ENOENT" };
        }
        if (filePath.endsWith("changelogger.config.json")) {
          return JSON.stringify({
            formatter: "keepachangelog",
            types: {
              added: "Added",
              fixed: "Fixed",
              changed: "Changed",
              feature: "Feature",
              fix: "Fix",
              tweak: "Tweak",
            },
          });
        }
        return "";
      },
    );

    // Mock writing the changelog file
    mockedFs.writeFile.mockResolvedValue(undefined);

    const options: WriteCommandOptions = {
      version: "1.1.0",
    };

    const result = await run(options);

    expect(mockedFs.writeFile).toHaveBeenCalled();
    expect(result).toContain("Updated changelog.md to version 1.1.0");

    // Verify changelog content
    const writeCall = mockedFs.writeFile.mock.calls[0];
    const writtenContent = writeCall[1] as string;
    expect(writtenContent).toContain("# Changelog");
    expect(writtenContent).toContain(
      "All notable changes to this project will be documented in this file.",
    );
    expect(writtenContent).toContain("## [1.1.0]");
    expect(writtenContent).toContain("### Added");
    expect(writtenContent).toContain("- Added new feature");
  });

  it("should create changelog file if it does not exist in StellarWP format", async () => {
    const changeFile: ChangeFile = {
      type: "added",
      significance: "minor",
      entry: "Added new feature",
    };

    // Mock reading change files
    mockedFs.readdir.mockResolvedValue(["change1.yaml"] as any);
    mockedFs.readFile.mockImplementation(
      async (path: PathLike | FileHandle) => {
        const filePath = path.toString();
        if (filePath.endsWith("change1.yaml")) {
          return yaml.stringify(changeFile);
        }
        if (filePath.endsWith("changelog.md")) {
          throw { code: "ENOENT" };
        }
        if (filePath.endsWith("changelogger.config.json")) {
          return JSON.stringify({
            formatter: "stellarwp",
            types: {
              added: "Added",
              fixed: "Fixed",
              changed: "Changed",
              feature: "Feature",
              fix: "Fix",
              tweak: "Tweak",
            },
          });
        }
        return "";
      },
    );

    // Mock writing the changelog file
    mockedFs.writeFile.mockResolvedValue(undefined);

    const options: WriteCommandOptions = {
      version: "1.1.0",
    };

    const result = await run(options);

    expect(mockedFs.writeFile).toHaveBeenCalled();
    expect(result).toContain("Updated changelog.md to version 1.1.0");

    // Verify changelog content
    const writeCall = mockedFs.writeFile.mock.calls[0];
    const writtenContent = writeCall[1] as string;
    expect(writtenContent).toContain("# Changelog");
    expect(writtenContent).toContain(
      "All notable changes to this project will be documented in this file.",
    );
    expect(writtenContent).toContain("## [1.1.0]");
    expect(writtenContent).toContain("### Added");
    expect(writtenContent).toContain("- Added new feature");
  });

  it("should clean up change files after writing", async () => {
    const changeFile: ChangeFile = {
      type: "added",
      significance: "minor",
      entry: "Added new feature",
    };

    mockedFs.readdir.mockResolvedValue(["change1.yaml"] as any);
    mockedFs.readFile.mockImplementation(
      async (path: PathLike | FileHandle) => {
        const filePath = path.toString();
        if (filePath.endsWith("change1.yaml")) {
          return yaml.stringify(changeFile);
        }
        if (filePath.endsWith("changelog.md")) {
          return "# Change Log\n";
        }
        return "";
      },
    );

    const options: WriteCommandOptions = {
      version: "1.1.0",
    };

    await run(options);

    expect(mockedFs.unlink).toHaveBeenCalled();
    const unlinkCall = mockedFs.unlink.mock.calls[0];
    expect(unlinkCall[0].toString()).toContain("change1.yaml");
  });

  it("should determine version bump based on significance", async () => {
    const changes: ChangeFile[] = [
      {
        type: "added",
        significance: "minor",
        entry: "Added feature 1",
      },
      {
        type: "fixed",
        significance: "patch",
        entry: "Fixed bug 1",
      },
    ];

    mockedFs.readdir.mockResolvedValue(["change1.yaml", "change2.yaml"] as any);
    mockedFs.readFile.mockImplementation(
      async (
        path: PathLike | FileHandle,
        options?:
          | BufferEncoding
          | (ObjectEncodingOptions &
              Abortable & { flag?: OpenMode | undefined })
          | null
          | undefined,
      ) => {
        const filePath = path.toString();
        if (filePath.endsWith("change1.yaml")) {
          return Promise.resolve(yaml.stringify(changes[0]));
        }
        if (filePath.endsWith("change2.yaml")) {
          return Promise.resolve(yaml.stringify(changes[1]));
        }
        if (filePath.endsWith("changelog.md")) {
          return Promise.resolve(
            "# Change Log\n= [1.0.0] 2024-03-22 =\n* Added - Initial feature\n",
          );
        }
        if (filePath.endsWith("changelogger.config.json")) {
          return Promise.resolve(
            JSON.stringify({
              formatter: "stellarwp",
              types: {
                added: "Added",
                fixed: "Fixed",
                changed: "Changed",
                feature: "Added",
                fix: "Fixed",
                tweak: "Changed",
              },
            }),
          );
        }
        throw new Error(`Unexpected file: ${filePath}`);
      },
    );

    const result = await run({});

    expect(result).toContain("Updated changelog.md to version 1.1.0");
  });

  it("should handle multiple change types", async () => {
    const changes: ChangeFile[] = [
      {
        type: "added",
        significance: "minor",
        entry: "Added feature 1",
      },
      {
        type: "fixed",
        significance: "patch",
        entry: "Fixed bug 1",
      },
      {
        type: "changed",
        significance: "patch",
        entry: "Changed behavior",
      },
    ];

    mockedFs.readdir.mockResolvedValue([
      "change1.yaml",
      "change2.yaml",
      "change3.yaml",
    ] as any);
    mockedFs.readFile.mockImplementation(
      async (
        path: PathLike | FileHandle,
        options?:
          | BufferEncoding
          | (ObjectEncodingOptions &
              Abortable & { flag?: OpenMode | undefined })
          | null
          | undefined,
      ) => {
        const filePath = path.toString();
        if (filePath.endsWith("change1.yaml")) {
          return Promise.resolve(yaml.stringify(changes[0]));
        }
        if (filePath.endsWith("change2.yaml")) {
          return Promise.resolve(yaml.stringify(changes[1]));
        }
        if (filePath.endsWith("change3.yaml")) {
          return Promise.resolve(yaml.stringify(changes[2]));
        }
        if (filePath.endsWith("changelog.md")) {
          return Promise.resolve(
            "# Change Log\n= [1.0.0] 2024-03-22 =\n* Added - Initial feature\n",
          );
        }
        if (filePath.endsWith("changelogger.config.json")) {
          return Promise.resolve(
            JSON.stringify({
              formatter: "stellarwp",
              types: {
                added: "Added",
                fixed: "Fixed",
                changed: "Changed",
                feature: "Added",
                fix: "Fixed",
                tweak: "Changed",
              },
            }),
          );
        }
        throw new Error(`Unexpected file: ${filePath}`);
      },
    );

    const result = await run({ version: "2.0.0" });

    expect(result).toContain("Updated changelog.md to version 2.0.0");

    const writeCall = mockedFs.writeFile.mock.calls[0];
    const writtenContent = writeCall[1] as string;
    expect(writtenContent).toContain("## [2.0.0]");
    expect(writtenContent).toContain("### Added");
    expect(writtenContent).toContain("- Added feature 1");
    expect(writtenContent).toContain("### Fixed");
    expect(writtenContent).toContain("- Fixed bug 1");
    expect(writtenContent).toContain("### Changed");
    expect(writtenContent).toContain("- Changed behavior");
  });

  it("should handle empty entries", async () => {
    const changes: ChangeFile[] = [
      {
        type: "added",
        significance: "patch",
        entry: "",
      },
      {
        type: "fixed",
        significance: "patch",
        entry: "Fixed bug 1",
      },
    ];

    mockedFs.readdir.mockResolvedValue(["change1.yaml", "change2.yaml"] as any);
    mockedFs.readFile.mockImplementation(
      async (
        path: PathLike | FileHandle,
        options?:
          | BufferEncoding
          | (ObjectEncodingOptions &
              Abortable & { flag?: OpenMode | undefined })
          | null
          | undefined,
      ) => {
        const filePath = path.toString();
        if (filePath.endsWith("change1.yaml")) {
          return Promise.resolve(yaml.stringify(changes[0]));
        }
        if (filePath.endsWith("change2.yaml")) {
          return Promise.resolve(yaml.stringify(changes[1]));
        }
        if (filePath.endsWith("changelog.md")) {
          return Promise.resolve(
            "# Change Log\n= [1.0.0] 2024-03-22 =\n* Added - Initial feature\n",
          );
        }
        if (filePath.endsWith("changelogger.config.json")) {
          return Promise.resolve(
            JSON.stringify({
              formatter: "stellarwp",
              types: {
                added: "Added",
                fixed: "Fixed",
                changed: "Changed",
                feature: "Added",
                fix: "Fixed",
                tweak: "Changed",
              },
            }),
          );
        }
        throw new Error(`Unexpected file: ${filePath}`);
      },
    );

    const result = await run({ version: "1.0.1" });

    expect(result).toContain("Updated changelog.md to version 1.0.1");

    const writeCall = mockedFs.writeFile.mock.calls[0];
    const writtenContent = writeCall[1] as string;
    expect(writtenContent).toContain("## [1.0.1]");
    expect(writtenContent).toContain("### Fixed");
    expect(writtenContent).toContain("- Fixed bug 1");
  });

  it("should handle invalid YAML files", async () => {
    mockedFs.readdir.mockResolvedValue(["change1.yaml"] as any);
    mockedFs.readFile.mockImplementation(
      async (
        path: PathLike | FileHandle,
        options?:
          | BufferEncoding
          | (ObjectEncodingOptions &
              Abortable & { flag?: OpenMode | undefined })
          | null
          | undefined,
      ) => {
        const filePath = path.toString();
        if (filePath.endsWith("change1.yaml")) {
          return "invalid: yaml: content:";
        }
        if (filePath.endsWith("changelog.md")) {
          return "# Change Log\n";
        }
        return "";
      },
    );

    await expect(run({ version: "1.0.0" })).rejects.toThrow();
  });

  it("should handle major version bumps", async () => {
    const changes: ChangeFile[] = [
      {
        type: "changed",
        significance: "major",
        entry: "Breaking change",
      },
    ];

    mockedFs.readdir.mockResolvedValue(["change1.yaml"] as any);
    mockedFs.readFile.mockImplementation(
      async (path: PathLike | FileHandle) => {
        const filePath = path.toString();
        if (filePath.endsWith("change1.yaml")) {
          return yaml.stringify(changes[0]);
        }
        if (filePath.endsWith("changelog.md")) {
          return "# Change Log\n= [1.0.0] 2024-03-21 =\n* Added - Initial feature\n";
        }
        if (filePath.endsWith("changelogger.config.json")) {
          return JSON.stringify({
            formatter: "stellarwp",
            types: {
              added: "Added",
              fixed: "Fixed",
              changed: "Changed",
              feature: "Added",
              fix: "Fixed",
              tweak: "Changed",
            },
          });
        }
        return "";
      },
    );

    const result = await run({});

    expect(result).toContain("Updated changelog.md to version 2.0.0");

    const writeCall = mockedFs.writeFile.mock.calls[0];
    const writtenContent = writeCall[1] as string;
    expect(writtenContent).toContain("## [2.0.0]");
    expect(writtenContent).toContain("### Changed");
    expect(writtenContent).toContain("- Breaking change");
  });

  it("should handle invalid version in changelog", async () => {
    const changes: ChangeFile[] = [
      {
        type: "fixed",
        significance: "patch",
        entry: "Fixed bug",
      },
    ];

    mockedFs.readdir.mockResolvedValue(["change1.yaml"] as any);
    mockedFs.readFile.mockImplementation(
      async (path: PathLike | FileHandle) => {
        const filePath = path.toString();
        if (filePath.endsWith("change1.yaml")) {
          return yaml.stringify(changes[0]);
        }
        if (filePath.endsWith("changelog.md")) {
          return "# Change Log\n## [invalid] - 2024-03-21\n";
        }
        return "";
      },
    );

    const result = await run({});

    expect(result).toContain("Updated changelog.md to version 0.1.1");
  });

  it("should handle mixed significance levels", async () => {
    const changes: ChangeFile[] = [
      {
        type: "added",
        significance: "major",
        entry: "Added feature 1",
      },
      {
        type: "fixed",
        significance: "minor",
        entry: "Fixed bug 1",
      },
      {
        type: "changed",
        significance: "patch",
        entry: "Changed behavior",
      },
    ];

    mockedFs.readdir.mockResolvedValue([
      "change1.yaml",
      "change2.yaml",
      "change3.yaml",
    ] as any);
    mockedFs.readFile.mockImplementation(
      async (path: PathLike | FileHandle) => {
        const filePath = path.toString();
        if (filePath.endsWith("change1.yaml")) {
          return yaml.stringify(changes[0]);
        }
        if (filePath.endsWith("change2.yaml")) {
          return yaml.stringify(changes[1]);
        }
        if (filePath.endsWith("change3.yaml")) {
          return yaml.stringify(changes[2]);
        }
        if (filePath.endsWith("changelog.md")) {
          return "# Change Log\n= [1.0.0] 2024-03-22 =\n* Added - Initial feature\n";
        }
        if (filePath.endsWith("changelogger.config.json")) {
          return JSON.stringify({
            formatter: "stellarwp",
            types: {
              added: "Added",
              fixed: "Fixed",
              changed: "Changed",
              feature: "Feature",
              fix: "Fix",
              tweak: "Tweak",
            },
          });
        }
        throw new Error(`Unexpected file path: ${filePath}`);
      },
    );

    const result = await run({});

    expect(result).toContain("Updated changelog.md to version 2.0.0");

    const writeCall = mockedFs.writeFile.mock.calls[0];
    const writtenContent = writeCall[1] as string;
    expect(writtenContent).toContain("## [2.0.0]");
    expect(writtenContent).toContain("### Added");
    expect(writtenContent).toContain("- Added feature 1");
    expect(writtenContent).toContain("### Fixed");
    expect(writtenContent).toContain("- Fixed bug 1");
    expect(writtenContent).toContain("### Changed");
    expect(writtenContent).toContain("- Changed behavior");
  });

  it("should append changes to existing version in Keep a Changelog format", async () => {
    const existingChanges: ChangeFile[] = [
      {
        type: "added",
        significance: "minor",
        entry: "Initial feature",
      },
    ];

    const newChanges: ChangeFile[] = [
      {
        type: "fixed",
        significance: "patch",
        entry: "Fixed bug in feature",
      },
    ];

    // Mock reading existing changelog
    mockedFs.readFile.mockImplementation(
      async (path: PathLike | FileHandle) => {
        const filePath = path.toString();
        if (filePath.endsWith("changelog.md")) {
          return `# Changelog\n\n## [1.0.0] - 2024-03-21 =\n\n* Added - Initial feature\n`;
        }
        if (filePath.endsWith("change1.yaml")) {
          return yaml.stringify(newChanges[0]);
        }
        if (filePath.endsWith("changelogger.config.json")) {
          return JSON.stringify({ formatter: "keepachangelog" });
        }
        return "";
      },
    );

    // Mock reading new change files
    mockedFs.readdir.mockResolvedValue(["change1.yaml"] as any);

    // Mock writing the changelog file
    mockedFs.writeFile.mockResolvedValue(undefined);

    const result = await run({ version: "1.0.0" });

    expect(result).toBe("Updated changelog.md to version 1.0.0");

    // Verify changelog content
    const writeCall = mockedFs.writeFile.mock.calls[0];
    const writtenContent = writeCall[1] as string;
    expect(writtenContent).toContain("## [1.0.0]");
    expect(writtenContent).toContain("* Added - Initial feature");
    expect(writtenContent).toContain("### Fixed");
    expect(writtenContent).toContain("- Fixed bug in feature");
  });

  it("should append changes to existing version in StellarWP format", async () => {
    const existingChanges: ChangeFile[] = [
      {
        type: "added",
        significance: "minor",
        entry: "Initial feature",
      },
    ];

    const newChanges: ChangeFile[] = [
      {
        type: "fixed",
        significance: "patch",
        entry: "Fixed bug in feature",
      },
    ];

    // Mock reading existing changelog
    mockedFs.readFile.mockImplementation(
      async (path: PathLike | FileHandle) => {
        const filePath = path.toString();
        if (filePath.endsWith("changelog.md")) {
          return "# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n= [1.0.0] 2024-03-21 =\n\n* Added - Initial feature\n";
        }
        if (filePath.endsWith("change1.yaml")) {
          return yaml.stringify(newChanges[0]);
        }
        if (filePath.endsWith("changelogger.config.json")) {
          return JSON.stringify({
            formatter: "stellarwp",
            types: {
              added: "Added",
              fixed: "Fixed",
              changed: "Changed",
              feature: "Feature",
              fix: "Fix",
              tweak: "Tweak",
            },
          });
        }
        return "";
      },
    );

    // Mock reading new change files
    mockedFs.readdir.mockResolvedValue(["change1.yaml"] as any);

    // Mock writing the changelog file
    mockedFs.writeFile.mockResolvedValue(undefined);

    const result = await run({ version: "1.0.0" });

    expect(result).toBe("Updated changelog.md to version 1.0.0");

    // Verify changelog content
    const writeCall = mockedFs.writeFile.mock.calls[0];
    const writtenContent = writeCall[1] as string;
    expect(writtenContent).toContain("= [1.0.0] 2024-03-21 =");
    expect(writtenContent).toContain("* Added - Initial feature");
    expect(writtenContent).toContain("### Fixed");
    expect(writtenContent).toContain("- Fixed bug in feature");
  });

  it("should handle mixed significance levels in StellarWP format", async () => {
    const changes: ChangeFile[] = [
      {
        type: "changed",
        significance: "major",
        entry: "Breaking change",
      },
      {
        type: "added",
        significance: "minor",
        entry: "New feature",
      },
      {
        type: "fixed",
        significance: "patch",
        entry: "Bug fix",
      },
    ];

    mockedFs.readdir.mockResolvedValue([
      "change1.yaml",
      "change2.yaml",
      "change3.yaml",
    ] as any);
    mockedFs.readFile.mockImplementation(
      async (path: PathLike | FileHandle) => {
        const filePath = path.toString();
        if (filePath.endsWith("change1.yaml")) {
          return yaml.stringify(changes[0]);
        }
        if (filePath.endsWith("change2.yaml")) {
          return yaml.stringify(changes[1]);
        }
        if (filePath.endsWith("change3.yaml")) {
          return yaml.stringify(changes[2]);
        }
        if (filePath.endsWith("changelog.md")) {
          return "# Changelog\n## [1.0.0] - 2024-03-21\n";
        }
        if (filePath.endsWith("changelogger.config.json")) {
          return JSON.stringify({ formatter: "stellarwp" });
        }
        return "";
      },
    );

    const result = await run({});

    expect(result).toContain("Updated changelog.md to version 2.0.0");

    const writeCall = mockedFs.writeFile.mock.calls[0];
    const writtenContent = writeCall[1] as string;
    expect(writtenContent).toContain("### Changed");
    expect(writtenContent).toContain("- Breaking change");
    expect(writtenContent).toContain("### Added");
    expect(writtenContent).toContain("- New feature");
    expect(writtenContent).toContain("### Fixed");
    expect(writtenContent).toContain("- Bug fix");
  });
});
