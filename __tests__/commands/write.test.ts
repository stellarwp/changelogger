import { run } from "../../src/commands/write";
import { loadConfig } from "../../src/utils/config";
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
      type: "feature",
      significance: "minor",
      entry: "Added new feature",
    };

    // Mock reading change files
    mockedFs.readdir.mockResolvedValue(["change1.yaml"] as any);
    mockedFs.readFile.mockImplementation(async (path: PathLike | FileHandle) => {
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
            fix: "Fix",
            changed: "Changed",
            feature: "Feature",
            tweak: "Tweak",
          },
        });
      }
      throw new Error(`Unexpected file path: ${filePath}`);
    });

    const options: WriteCommandOptions = {
      overwriteVersion: "1.1.0",
    };

    const result = await run(options);

    expect(mockedFs.writeFile).toHaveBeenCalled();
    expect(result).toContain("Updated changelog.md to version 1.1.0");

    // Verify changelog content
    const writeCall = mockedFs.writeFile.mock.calls[0];
    const writtenContent = writeCall?.[1] as string;
    expect(writtenContent).toContain("= [1.1.0]");
    expect(writtenContent).toContain("* Added - Added new feature");
  });

  it("should write changelog entries correctly in Keep a Changelog format", async () => {
    const changeFile: ChangeFile = {
      type: "feature",
      significance: "minor",
      entry: "Added new feature",
    };

    // Mock reading change files
    mockedFs.readdir.mockResolvedValue(["change1.yaml"] as any);
    mockedFs.readFile.mockImplementation(
      async (
        path: PathLike | FileHandle,
        options?: BufferEncoding | (ObjectEncodingOptions & Abortable & { flag?: OpenMode | undefined }) | null | undefined
      ) => {
        const filePath = path.toString();
        if (filePath.endsWith("change1.yaml")) {
          return Promise.resolve(yaml.stringify(changeFile));
        }
        if (filePath.endsWith("changelog.md")) {
          return Promise.resolve(
            "# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n## [1.0.0] - 2024-03-21\n\n### Added\n- Initial feature\n"
          );
        }
        if (filePath.endsWith("changelogger.config.json")) {
          return Promise.resolve(
            JSON.stringify({
              formatter: "keepachangelog",
              types: {
                added: "Added",
                fix: "Fix",
                changed: "Changed",
                feature: "Feature",
                tweak: "Tweak",
              },
            })
          );
        }
        throw new Error(`Unexpected file: ${filePath}`);
      }
    );

    const options: WriteCommandOptions = {
      overwriteVersion: "1.1.0",
    };

    const result = await run(options);

    expect(mockedFs.writeFile).toHaveBeenCalled();
    expect(result).toContain("Updated changelog.md to version 1.1.0");

    // Verify changelog content
    const writeCall = mockedFs.writeFile.mock.calls[0];
    const writtenContent = writeCall?.[1] as string;
    expect(writtenContent).toContain("## [1.0.0]");
    expect(writtenContent).toContain("### Added");
    expect(writtenContent).toContain("- Initial feature");
  });

  it("should write changelog entries correctly in StellarWP format", async () => {
    const changeFile: ChangeFile = {
      type: "feature",
      significance: "minor",
      entry: "Added new feature",
    };

    // Mock reading change files
    mockedFs.readdir.mockResolvedValue(["change1.yaml"] as any);
    mockedFs.readFile.mockImplementation(async (path: PathLike | FileHandle) => {
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
            fix: "Fix",
            changed: "Changed",
            feature: "Feature",
            tweak: "Tweak",
          },
        });
      }
      return "";
    });

    const options: WriteCommandOptions = {
      overwriteVersion: "1.1.0",
    };

    const result = await run(options);

    expect(mockedFs.writeFile).toHaveBeenCalled();
    expect(result).toContain("Updated changelog.md to version 1.1.0");

    // Verify changelog content
    const writeCall = mockedFs.writeFile.mock.calls[0];
    const writtenContent = writeCall?.[1] as string;
    expect(writtenContent).toContain("= [1.1.0]");
    expect(writtenContent).toContain("* Added - Added new feature");
  });

  it("should handle empty changes directory", async () => {
    mockedFs.readdir.mockResolvedValue([]);
    mockedFs.readFile.mockImplementation(async (path: PathLike | FileHandle) => {
      const filePath = path.toString();
      if (filePath.endsWith("changelogger.config.json")) {
        return JSON.stringify({ formatter: "stellarwp" });
      }
      return "";
    });

    const options: WriteCommandOptions = {
      overwriteVersion: "1.1.0",
    };

    const result = await run(options);

    expect(result).toBe("No changes to write");
  });

  it("should handle non-existent changes directory", async () => {
    mockedFs.readdir.mockRejectedValue({ code: "ENOENT" });
    mockedFs.readFile.mockImplementation(async (path: PathLike | FileHandle) => {
      const filePath = path.toString();
      if (filePath.endsWith("changelogger.config.json")) {
        return JSON.stringify({ formatter: "stellarwp" });
      }
      return "";
    });

    const options: WriteCommandOptions = {
      overwriteVersion: "1.1.0",
    };

    const result = await run(options);

    expect(result).toBe("No changes directory found");
  });

  it("should create changelog file if it does not exist in Keep a Changelog format", async () => {
    const changeFile: ChangeFile = {
      type: "feature",
      significance: "minor",
      entry: "Added new feature",
    };

    // Mock reading change files
    mockedFs.readdir.mockResolvedValue(["change1.yaml"] as any);
    mockedFs.readFile.mockImplementation(async (path: PathLike | FileHandle) => {
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
            fix: "Fix",
            changed: "Changed",
            feature: "Feature",
            tweak: "Tweak",
          },
        });
      }
      return "";
    });

    // Mock writing the changelog file
    mockedFs.writeFile.mockResolvedValue(undefined);

    const options: WriteCommandOptions = {
      overwriteVersion: "1.1.0",
    };

    const result = await run(options);

    expect(mockedFs.writeFile).toHaveBeenCalled();
    expect(result).toContain("Updated changelog.md to version 1.1.0");

    // Verify changelog content
    const writeCall = mockedFs.writeFile.mock.calls[0];
    const writtenContent = writeCall?.[1] as string;
    expect(writtenContent).toContain("# Changelog");
    expect(writtenContent).toContain("All notable changes to this project will be documented in this file.");
    expect(writtenContent).toContain("## [1.1.0]");
    expect(writtenContent).toContain("### Added");
    expect(writtenContent).toContain("- Added new feature");
  });

  it("should create changelog file if it does not exist in StellarWP format", async () => {
    const changeFile: ChangeFile = {
      type: "feature",
      significance: "minor",
      entry: "Added new feature",
    };

    // Mock reading change files
    mockedFs.readdir.mockResolvedValue(["change1.yaml"] as any);
    mockedFs.readFile.mockImplementation(async (path: PathLike | FileHandle) => {
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
            fix: "Fix",
            changed: "Changed",
            feature: "Feature",
            tweak: "Tweak",
          },
        });
      }
      return "";
    });

    // Mock writing the changelog file
    mockedFs.writeFile.mockResolvedValue(undefined);

    const options: WriteCommandOptions = {
      overwriteVersion: "1.1.0",
    };

    const result = await run(options);

    expect(mockedFs.writeFile).toHaveBeenCalled();
    expect(result).toContain("Updated changelog.md to version 1.1.0");

    // Verify changelog content
    const writeCall = mockedFs.writeFile.mock.calls[0];
    const writtenContent = writeCall?.[1] as string;
    expect(writtenContent).toContain("# Changelog");
    expect(writtenContent).toContain("All notable changes to this project will be documented in this file.");
    expect(writtenContent).toContain("## [1.1.0]");
    expect(writtenContent).toContain("### Added");
    expect(writtenContent).toContain("- Added new feature");
  });

  it("should clean up change files after writing", async () => {
    const changeFile: ChangeFile = {
      type: "feature",
      significance: "minor",
      entry: "Added new feature",
    };

    mockedFs.readdir.mockResolvedValue(["change1.yaml"] as any);
    mockedFs.readFile.mockImplementation(async (path: PathLike | FileHandle) => {
      const filePath = path.toString();
      if (filePath.endsWith("change1.yaml")) {
        return yaml.stringify(changeFile);
      }
      if (filePath.endsWith("changelog.md")) {
        return "# Change Log\n";
      }
      return "";
    });

    const options: WriteCommandOptions = {
      overwriteVersion: "1.1.0",
    };

    await run(options);

    expect(mockedFs.unlink).toHaveBeenCalled();
    const unlinkCall = mockedFs.unlink.mock.calls[0];
    expect(unlinkCall?.[0]?.toString()).toContain("change1.yaml");
  });

  it("should determine version bump based on significance", async () => {
    const changes: ChangeFile[] = [
      {
        type: "feature",
        significance: "minor",
        entry: "Added feature 1",
      },
      {
        type: "fix",
        significance: "patch",
        entry: "Fixed bug 1",
      },
    ];

    mockedFs.readdir.mockResolvedValue(["change1.yaml", "change2.yaml"] as any);
    mockedFs.readFile.mockImplementation(
      async (
        path: PathLike | FileHandle,
        options?: BufferEncoding | (ObjectEncodingOptions & Abortable & { flag?: OpenMode | undefined }) | null | undefined
      ) => {
        const filePath = path.toString();
        if (filePath.endsWith("change1.yaml")) {
          return Promise.resolve(yaml.stringify(changes[0]));
        }
        if (filePath.endsWith("change2.yaml")) {
          return Promise.resolve(yaml.stringify(changes[1]));
        }
        if (filePath.endsWith("changelog.md")) {
          return Promise.resolve("# Change Log\n= [1.0.0] 2024-03-22 =\n* Added - Initial feature\n");
        }
        if (filePath.endsWith("changelogger.config.json")) {
          return Promise.resolve(
            JSON.stringify({
              formatter: "stellarwp",
              types: {
                added: "Added",
                fix: "Fix",
                changed: "Changed",
                feature: "Added",
                tweak: "Changed",
              },
            })
          );
        }
        throw new Error(`Unexpected file: ${filePath}`);
      }
    );

    const result = await run({});

    expect(result).toContain("Updated changelog.md to version 1.1.0");
  });

  it("should handle multiple change types", async () => {
    const changes: ChangeFile[] = [
      {
        type: "feature",
        significance: "minor",
        entry: "Added feature 1",
      },
      {
        type: "fix",
        significance: "patch",
        entry: "Fixed bug 1",
      },
      {
        type: "tweak",
        significance: "patch",
        entry: "Changed behavior",
      },
    ];

    mockedFs.readdir.mockResolvedValue(["change1.yaml", "change2.yaml", "change3.yaml"] as any);
    mockedFs.readFile.mockImplementation(
      async (
        path: PathLike | FileHandle,
        options?: BufferEncoding | (ObjectEncodingOptions & Abortable & { flag?: OpenMode | undefined }) | null | undefined
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
          return Promise.resolve("# Change Log\n= [1.0.0] 2024-03-22 =\n* Added - Initial feature\n");
        }
        if (filePath.endsWith("changelogger.config.json")) {
          return Promise.resolve(
            JSON.stringify({
              formatter: "stellarwp",
              types: {
                added: "Added",
                fix: "Fix",
                changed: "Changed",
                feature: "Added",
                tweak: "Changed",
              },
            })
          );
        }
        throw new Error(`Unexpected file: ${filePath}`);
      }
    );

    const result = await run({ overwriteVersion: "2.0.0" });

    expect(result).toContain("Updated changelog.md to version 2.0.0");

    const writeCall = mockedFs.writeFile.mock.calls[0];
    const writtenContent = writeCall?.[1] as string;
    expect(writtenContent).toContain("## [2.0.0]");
    expect(writtenContent).toContain("### Added");
    expect(writtenContent).toContain("- Added feature 1");
    expect(writtenContent).toContain("### Fix");
    expect(writtenContent).toContain("- Fixed bug 1");
    expect(writtenContent).toContain("### Changed");
    expect(writtenContent).toContain("- Changed behavior");
  });

  it("should handle empty entries", async () => {
    const changes: ChangeFile[] = [
      {
        type: "feature",
        significance: "patch",
        entry: "",
      },
      {
        type: "fix",
        significance: "patch",
        entry: "Fixed bug 1",
      },
    ];

    mockedFs.readdir.mockResolvedValue(["change1.yaml", "change2.yaml"] as any);
    mockedFs.readFile.mockImplementation(
      async (
        path: PathLike | FileHandle,
        options?: BufferEncoding | (ObjectEncodingOptions & Abortable & { flag?: OpenMode | undefined }) | null | undefined
      ) => {
        const filePath = path.toString();
        if (filePath.endsWith("change1.yaml")) {
          return Promise.resolve(yaml.stringify(changes[0]));
        }
        if (filePath.endsWith("change2.yaml")) {
          return Promise.resolve(yaml.stringify(changes[1]));
        }
        if (filePath.endsWith("changelog.md")) {
          return Promise.resolve("# Change Log\n= [1.0.0] 2024-03-22 =\n* Added - Initial feature\n");
        }
        if (filePath.endsWith("changelogger.config.json")) {
          return Promise.resolve(
            JSON.stringify({
              formatter: "stellarwp",
              types: {
                added: "Added",
                fix: "Fix",
                changed: "Changed",
                feature: "Added",
                tweak: "Changed",
              },
            })
          );
        }
        throw new Error(`Unexpected file: ${filePath}`);
      }
    );

    const result = await run({ overwriteVersion: "1.0.1" });

    expect(result).toContain("Updated changelog.md to version 1.0.1");

    const writeCall = mockedFs.writeFile.mock.calls[0];
    const writtenContent = writeCall?.[1] as string;
    expect(writtenContent).toContain("## [1.0.1]");
    expect(writtenContent).toContain("### Fix");
    expect(writtenContent).toContain("- Fixed bug 1");
  });

  it("should handle invalid YAML files", async () => {
    mockedFs.readdir.mockResolvedValue(["change1.yaml"] as any);
    mockedFs.readFile.mockImplementation(
      async (
        path: PathLike | FileHandle,
        options?: BufferEncoding | (ObjectEncodingOptions & Abortable & { flag?: OpenMode | undefined }) | null | undefined
      ) => {
        const filePath = path.toString();
        if (filePath.endsWith("change1.yaml")) {
          return "invalid: yaml: content:";
        }
        if (filePath.endsWith("changelog.md")) {
          return "# Change Log\n";
        }
        return "";
      }
    );

    await expect(run({ overwriteVersion: "1.0.0" })).rejects.toThrow();
  });

  it("should handle major version bumps", async () => {
    const changes: ChangeFile[] = [
      {
        type: "tweak",
        significance: "major",
        entry: "Breaking change",
      },
    ];

    mockedFs.readdir.mockResolvedValue(["change1.yaml"] as any);
    mockedFs.readFile.mockImplementation(async (path: PathLike | FileHandle) => {
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
            fix: "Fix",
            changed: "Changed",
            feature: "Added",
            tweak: "Changed",
          },
        });
      }
      return "";
    });

    const result = await run({});

    expect(result).toContain("Updated changelog.md to version 2.0.0");

    const writeCall = mockedFs.writeFile.mock.calls[0];
    const writtenContent = writeCall?.[1] as string;
    expect(writtenContent).toContain("## [2.0.0]");
    expect(writtenContent).toContain("### Changed");
    expect(writtenContent).toContain("- Breaking change");
  });

  it("should handle invalid version in changelog", async () => {
    const changes: ChangeFile[] = [
      {
        type: "fix",
        significance: "patch",
        entry: "Fix bug",
      },
    ];

    mockedFs.readdir.mockResolvedValue(["change1.yaml"] as any);
    mockedFs.readFile.mockImplementation(async (path: PathLike | FileHandle) => {
      const filePath = path.toString();
      if (filePath.endsWith("change1.yaml")) {
        return yaml.stringify(changes[0]);
      }
      if (filePath.endsWith("changelog.md")) {
        return "# Change Log\n## [invalid] - 2024-03-21\n";
      }
      return "";
    });

    const result = await run({});

    expect(result).toContain("Updated changelog.md to version 0.1.1");
  });

  it("should handle mixed significance levels", async () => {
    const changes: ChangeFile[] = [
      {
        type: "feature",
        significance: "major",
        entry: "Added feature 1",
      },
      {
        type: "fix",
        significance: "minor",
        entry: "Fixed bug 1",
      },
      {
        type: "tweak",
        significance: "patch",
        entry: "Changed behavior",
      },
    ];

    mockedFs.readdir.mockResolvedValue(["change1.yaml", "change2.yaml", "change3.yaml"] as any);
    mockedFs.readFile.mockImplementation(async (path: PathLike | FileHandle) => {
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
            fix: "Fix",
            changed: "Changed",
            feature: "Feature",
            tweak: "Tweak",
          },
        });
      }
      throw new Error(`Unexpected file path: ${filePath}`);
    });

    const result = await run({});

    expect(result).toContain("Updated changelog.md to version 2.0.0");

    const writeCall = mockedFs.writeFile.mock.calls[0];
    const writtenContent = writeCall?.[1] as string;
    expect(writtenContent).toContain("## [2.0.0]");
    expect(writtenContent).toContain("### Added");
    expect(writtenContent).toContain("- Added feature 1");
    expect(writtenContent).toContain("### Fix");
    expect(writtenContent).toContain("- Fixed bug 1");
    expect(writtenContent).toContain("### Changed");
    expect(writtenContent).toContain("- Changed behavior");
  });

  it("should append changes to existing version in Keep a Changelog format", async () => {
    const existingChanges: ChangeFile[] = [
      {
        type: "feature",
        significance: "minor",
        entry: "Initial feature",
      },
    ];

    const newChanges: ChangeFile[] = [
      {
        type: "fix",
        significance: "patch",
        entry: "Fixed bug in feature",
      },
    ];

    // Mock reading existing changelog
    mockedFs.readFile.mockImplementation(async (path: PathLike | FileHandle) => {
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
    });

    // Mock reading new change files
    mockedFs.readdir.mockResolvedValue(["change1.yaml"] as any);

    // Mock writing the changelog file
    mockedFs.writeFile.mockResolvedValue(undefined);

    const result = await run({ overwriteVersion: "1.0.0" });

    expect(result).toBe("Updated changelog.md to version 1.0.0");

    // Verify changelog content
    const writeCall = mockedFs.writeFile.mock.calls[0];
    const writtenContent = writeCall?.[1] as string;
    expect(writtenContent).toContain("## [1.0.0]");
    expect(writtenContent).toContain("* Added - Initial feature");
    expect(writtenContent).toContain("### Fix");
    expect(writtenContent).toContain("- Fixed bug in feature");
  });

  it("should append changes to existing version in StellarWP format", async () => {
    const existingChanges: ChangeFile[] = [
      {
        type: "feature",
        significance: "minor",
        entry: "Initial feature",
      },
    ];

    const newChanges: ChangeFile[] = [
      {
        type: "fix",
        significance: "patch",
        entry: "Fixed bug in feature",
      },
    ];

    // Mock reading existing changelog
    mockedFs.readFile.mockImplementation(async (path: PathLike | FileHandle) => {
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
            fix: "Fix",
            changed: "Changed",
            feature: "Feature",
            tweak: "Tweak",
          },
        });
      }
      return "";
    });

    // Mock reading new change files
    mockedFs.readdir.mockResolvedValue(["change1.yaml"] as any);

    // Mock writing the changelog file
    mockedFs.writeFile.mockResolvedValue(undefined);

    const result = await run({ overwriteVersion: "1.0.0" });

    expect(result).toBe("Updated changelog.md to version 1.0.0");

    // Verify changelog content
    const writeCall = mockedFs.writeFile.mock.calls[0];
    const writtenContent = writeCall?.[1] as string;
    expect(writtenContent).toContain("= [1.0.0] 2024-03-21 =");
    expect(writtenContent).toContain("* Added - Initial feature");
    expect(writtenContent).toContain("### Fix");
    expect(writtenContent).toContain("- Fixed bug in feature");
  });

  it("should handle mixed significance levels in StellarWP format", async () => {
    const changes: ChangeFile[] = [
      {
        type: "tweak",
        significance: "major",
        entry: "Breaking change",
      },
      {
        type: "feature",
        significance: "minor",
        entry: "New feature",
      },
      {
        type: "fix",
        significance: "patch",
        entry: "Bug fix",
      },
    ];

    mockedFs.readdir.mockResolvedValue(["change1.yaml", "change2.yaml", "change3.yaml"] as any);
    mockedFs.readFile.mockImplementation(async (path: PathLike | FileHandle) => {
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
    });

    const result = await run({});

    expect(result).toContain("Updated changelog.md to version 2.0.0");

    const writeCall = mockedFs.writeFile.mock.calls[0];
    const writtenContent = writeCall?.[1] as string;
    expect(writtenContent).toContain("### Changed");
    expect(writtenContent).toContain("- Breaking change");
    expect(writtenContent).toContain("### Added");
    expect(writtenContent).toContain("- New feature");
    expect(writtenContent).toContain("### Fix");
    expect(writtenContent).toContain("- Bug fix");
  });

  it("should preserve content after overwritten version (issue #82)", async () => {
    const changeFile: ChangeFile = {
      type: "feature",
      significance: "minor",
      entry: "New changelog entry",
    };

    // Mock existing changelog with multiple versions
    const existingChangelog = `= [1.1.0] 2025-08-05 =

* Feature - Old changelog for 1.1.0.

= [1.0.0] 2025-08-04 =

* Feature - Old changelog for 1.0.0.
* Fix - Some bug fix.

= [0.9.0] 2025-08-03 =

* Feature - Even older changelog.`;

    mockedFs.readdir.mockResolvedValue(["change1.yaml"] as any);
    mockedFs.readFile.mockImplementation(async (path: PathLike | FileHandle) => {
      const filePath = path.toString();
      if (filePath.endsWith("change1.yaml")) {
        return yaml.stringify(changeFile);
      }
      if (filePath.endsWith("package.json")) {
        return JSON.stringify({
          version: "1.1.0",
          changelogger: {
            changelogFile: "changelog.txt",
            files: [
              {
                path: "changelog.txt",
                strategy: "stellarwp-readme",
              },
            ],
          },
        });
      }
      if (filePath.endsWith("changelog.txt")) {
        return existingChangelog;
      }
      return "";
    });

    const options: WriteCommandOptions = {
      overwriteVersion: "1.1.0",
    };

    // Force reload config to use the mocked package.json.
    await loadConfig(true);

    const result = await run(options);

    // The result message uses the default changelog name, not the configured file path
    expect(result).toContain("Updated changelog.md to version 1.1.0");

    const writeCall = mockedFs.writeFile.mock.calls[0];
    const writtenContent = writeCall?.[1] as string;

    // The key part of this test is that when using --overwrite-version,
    // new changes are APPENDED to the existing version content

    // Should contain all versions
    expect(writtenContent).toContain("1.1.0");
    expect(writtenContent).toContain("1.0.0");
    expect(writtenContent).toContain("0.9.0");

    // Should contain both old and new entries
    expect(writtenContent).toContain("Old changelog for 1.1.0");
    expect(writtenContent).toContain("New changelog entry");
    expect(writtenContent).toContain("Old changelog for 1.0.0");
    expect(writtenContent).toContain("Some bug fix");
    expect(writtenContent).toContain("Even older changelog");

    // CRITICAL: New entries should come AFTER existing entries in the same version
    const oldEntryIndex = writtenContent.indexOf("Old changelog for 1.1.0");
    const newEntryIndex = writtenContent.indexOf("New changelog entry");
    expect(newEntryIndex).toBeGreaterThan(oldEntryIndex);
    expect(oldEntryIndex).toBeGreaterThan(-1);
    expect(newEntryIndex).toBeGreaterThan(-1);

    // CRITICAL: Older versions should still exist AFTER the 1.1.0 section
    const version110Index = writtenContent.indexOf("= [1.1.0]");
    const version100Index = writtenContent.indexOf("= [1.0.0]");
    const version090Index = writtenContent.indexOf("= [0.9.0]");
    expect(version110Index).toBeGreaterThan(-1);
    expect(version100Index).toBeGreaterThan(version110Index);
    expect(version090Index).toBeGreaterThan(version100Index);

    // The 1.0.0 content should still exist after 1.1.0
    expect(version100Index).toBeGreaterThan(newEntryIndex);
  });

  it("should support manually setting a non-existent version", async () => {
    const changeFile: ChangeFile = {
      type: "feature",
      significance: "minor",
      entry: "Added new feature",
    };

    // Mock reading change files
    mockedFs.readdir.mockResolvedValue(["change1.yaml"] as any);
    mockedFs.readFile.mockImplementation(async (path: PathLike | FileHandle) => {
      const filePath = path.toString();
      if (filePath.endsWith("change1.yaml")) {
        return yaml.stringify(changeFile);
      }
      if (filePath.endsWith("changelog.md")) {
        return "## [1.1.0] 2024-03-22### Added\n- Old feature\n";
      }
      if (filePath.endsWith("changelogger.config.json")) {
        return JSON.stringify({
          formatter: "stellarwp",
          types: {
            added: "Added",
            fix: "Fix",
            changed: "Changed",
            feature: "Feature",
            tweak: "Tweak",
          },
        });
      }
      throw new Error(`Unexpected file path: ${filePath}`);
    });

    // Force reload config to use the default config.
    await loadConfig(true);

    const options: WriteCommandOptions = {
      overwriteVersion: "1.2.0", // This version does not exist in the changelog.
    };

    const result = await run(options);

    expect(mockedFs.writeFile).toHaveBeenCalled();
    expect(result).toContain("Updated changelog.md to version 1.2.0");

    // Verify changelog content
    const writeCall = mockedFs.writeFile.mock.calls[0];
    const writtenContent = writeCall?.[1] as string;
    expect(writtenContent).toContain("## [1.2.0]");
    expect(writtenContent).toContain("- Added new feature");

    // Verify new version is at the top of the file (before old version)
    const newVersionIndex = writtenContent.indexOf("## [1.2.0]");
    const oldVersionIndex = writtenContent.indexOf("## [1.1.0]");
    expect(newVersionIndex).toBeGreaterThan(-1);
    expect(oldVersionIndex).toBeGreaterThan(-1);
    expect(newVersionIndex).toBeLessThan(oldVersionIndex);
  });

  it("should respect per-file ordering configuration", async () => {
    const changes: ChangeFile[] = [
      {
        type: "tweak",
        significance: "patch",
        entry: "Alpha tweak",
      },
      {
        type: "feature",
        significance: "minor",
        entry: "Beta feature",
      },
      {
        type: "fix",
        significance: "major",
        entry: "Gamma fix",
      },
    ];

    mockedFs.readdir.mockResolvedValue(["change1.yaml", "change2.yaml", "change3.yaml"] as any);
    mockedFs.readFile.mockImplementation(async (pathArg: PathLike | FileHandle) => {
      const pathStr = pathArg.toString();
      if (pathStr.endsWith("change1.yaml")) {
        return yaml.stringify(changes[0]);
      }
      if (pathStr.endsWith("change2.yaml")) {
        return yaml.stringify(changes[1]);
      }
      if (pathStr.endsWith("change3.yaml")) {
        return yaml.stringify(changes[2]);
      }
      if (pathStr.endsWith("changelog.md")) {
        return "# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n";
      }
      if (pathStr.endsWith("changelog-by-significance.md")) {
        return "# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n";
      }
      if (pathStr.endsWith("package.json")) {
        return JSON.stringify({
          changelogger: {
            ordering: ["type", "content"],
            files: [
              {
                path: "changelog.md",
                strategy: "stellarwp-changelog",
              },
              {
                path: "changelog-by-significance.md",
                strategy: "stellarwp-changelog",
                ordering: ["significance", "content"],
              },
            ],
          },
        });
      }
      throw new Error(`Unexpected file path: ${pathStr}`);
    });

    // Force config reload to pick up the mocked package.json
    await loadConfig(true);

    const options: WriteCommandOptions = {
      overwriteVersion: "2.0.0",
    };

    const result = await run(options);

    expect(mockedFs.writeFile).toHaveBeenCalledTimes(2);
    expect(result).toContain("Updated changelog.md to version 2.0.0");

    // First file uses global ordering: ["type", "content"]
    // Order should be: feature (Beta), fix (Gamma), tweak (Alpha) - sorted by type alphabetically
    const firstWriteCall = mockedFs.writeFile.mock.calls[0];
    const firstContent = firstWriteCall?.[1] as string;
    const firstFeatureIndex = firstContent.indexOf("Beta feature");
    const firstFixIndex = firstContent.indexOf("Gamma fix");
    const firstTweakIndex = firstContent.indexOf("Alpha tweak");
    expect(firstFeatureIndex).toBeLessThan(firstFixIndex);
    expect(firstFixIndex).toBeLessThan(firstTweakIndex);

    // Second file uses per-file ordering: ["significance", "content"]
    // Order should be: fix (major), feature (minor), tweak (patch) - sorted by significance
    const secondWriteCall = mockedFs.writeFile.mock.calls[1];
    const secondContent = secondWriteCall?.[1] as string;
    const secondFixIndex = secondContent.indexOf("Gamma fix");
    const secondFeatureIndex = secondContent.indexOf("Beta feature");
    const secondTweakIndex = secondContent.indexOf("Alpha tweak");
    expect(secondFixIndex).toBeLessThan(secondFeatureIndex);
    expect(secondFeatureIndex).toBeLessThan(secondTweakIndex);
  });
});
