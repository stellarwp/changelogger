import { run } from "../../src/commands/write";
import * as fs from "fs/promises";
import * as path from "path";
import * as yaml from "yaml";
import { ChangeFile, WriteCommandOptions } from "../../src/types";
import { PathLike } from "fs";
import { FileHandle } from "fs/promises";

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
        if (filePath.endsWith("CHANGELOG.md")) {
          return "# Change Log\n";
        }
        return "";
      },
    );

    const options: WriteCommandOptions = {
      version: "1.1.0",
    };

    const result = await run(options);

    expect(mockedFs.writeFile).toHaveBeenCalled();
    expect(result).toContain("Updated CHANGELOG.md to version 1.1.0");

    // Verify changelog content
    const writeCall = mockedFs.writeFile.mock.calls[0];
    const writtenContent = writeCall[1] as string;
    expect(writtenContent).toContain("## [1.1.0]");
    expect(writtenContent).toContain("### Added");
    expect(writtenContent).toContain("- Added new feature");
  });

  it("should handle empty changes directory", async () => {
    mockedFs.readdir.mockResolvedValue([]);

    const options: WriteCommandOptions = {
      version: "1.1.0",
    };

    const result = await run(options);

    expect(result).toBe("No changes to write");
  });

  it("should handle non-existent changes directory", async () => {
    mockedFs.readdir.mockRejectedValue({ code: "ENOENT" });

    const options: WriteCommandOptions = {
      version: "1.1.0",
    };

    const result = await run(options);

    expect(result).toBe("No changes directory found");
  });

  it("should create changelog file if it does not exist", async () => {
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
        if (filePath.endsWith("CHANGELOG.md")) {
          throw { code: "ENOENT" };
        }
        return "";
      },
    );

    const options: WriteCommandOptions = {
      version: "1.1.0",
    };

    const result = await run(options);

    expect(mockedFs.writeFile).toHaveBeenCalled();
    expect(result).toContain("Updated CHANGELOG.md to version 1.1.0");

    // Verify changelog content
    const writeCall = mockedFs.writeFile.mock.calls[0];
    const writtenContent = writeCall[1] as string;
    expect(writtenContent).toContain("# Change Log");
    expect(writtenContent).toContain(
      "All notable changes to this project will be documented in this file.",
    );
    expect(writtenContent).toContain("## [1.1.0]");
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
        if (filePath.endsWith("CHANGELOG.md")) {
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
      async (path: PathLike | FileHandle) => {
        const filePath = path.toString();
        if (filePath.endsWith("change1.yaml")) {
          return yaml.stringify(changes[0]);
        }
        if (filePath.endsWith("change2.yaml")) {
          return yaml.stringify(changes[1]);
        }
        if (filePath.endsWith("CHANGELOG.md")) {
          return "# Change Log\n## [1.0.0] - 2024-03-21\n";
        }
        return "";
      },
    );

    const result = await run({});

    expect(result).toContain("Updated CHANGELOG.md to version 1.1.0");
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
        if (filePath.endsWith("CHANGELOG.md")) {
          return "# Change Log\n";
        }
        return "";
      },
    );

    const result = await run({ version: "2.0.0" });

    expect(result).toContain("Updated CHANGELOG.md to version 2.0.0");

    const writeCall = mockedFs.writeFile.mock.calls[0];
    const writtenContent = writeCall[1] as string;
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
      async (path: PathLike | FileHandle) => {
        const filePath = path.toString();
        if (filePath.endsWith("change1.yaml")) {
          return yaml.stringify(changes[0]);
        }
        if (filePath.endsWith("change2.yaml")) {
          return yaml.stringify(changes[1]);
        }
        if (filePath.endsWith("CHANGELOG.md")) {
          return "# Change Log\n";
        }
        return "";
      },
    );

    const result = await run({ version: "1.0.1" });

    expect(result).toContain("Updated CHANGELOG.md to version 1.0.1");

    const writeCall = mockedFs.writeFile.mock.calls[0];
    const writtenContent = writeCall[1] as string;
    expect(writtenContent).toContain("### Fixed");
    expect(writtenContent).toContain("- Fixed bug 1");
    expect(writtenContent.match(/### Added\n\n### /)).toBeTruthy();
  });

  it("should handle invalid YAML files", async () => {
    mockedFs.readdir.mockResolvedValue(["change1.yaml"] as any);
    mockedFs.readFile.mockImplementation(
      async (path: PathLike | FileHandle) => {
        const filePath = path.toString();
        if (filePath.endsWith("change1.yaml")) {
          return "invalid: yaml: content:";
        }
        if (filePath.endsWith("CHANGELOG.md")) {
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
        if (filePath.endsWith("CHANGELOG.md")) {
          return "# Change Log\n## [1.0.0] - 2024-03-21\n";
        }
        return "";
      },
    );

    const result = await run({});

    expect(result).toContain("Updated CHANGELOG.md to version 2.0.0");
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
        if (filePath.endsWith("CHANGELOG.md")) {
          return "# Change Log\n## [invalid] - 2024-03-21\n";
        }
        return "";
      },
    );

    const result = await run({});

    expect(result).toContain("Updated CHANGELOG.md to version 0.1.1");
  });

  it("should handle mixed significance levels", async () => {
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
        if (filePath.endsWith("CHANGELOG.md")) {
          return "# Change Log\n## [1.0.0] - 2024-03-21\n";
        }
        return "";
      },
    );

    const result = await run({});

    expect(result).toContain("Updated CHANGELOG.md to version 2.0.0");

    const writeCall = mockedFs.writeFile.mock.calls[0];
    const writtenContent = writeCall[1] as string;
    expect(writtenContent).toContain("### Changed");
    expect(writtenContent).toContain("- Breaking change");
    expect(writtenContent).toContain("### Added");
    expect(writtenContent).toContain("- New feature");
    expect(writtenContent).toContain("### Fixed");
    expect(writtenContent).toContain("- Bug fix");
  });

  it("should handle filesystem errors", async () => {
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
        if (filePath.endsWith("CHANGELOG.md")) {
          return "# Change Log\n";
        }
        return "";
      },
    );
    mockedFs.writeFile.mockRejectedValue(new Error("Permission denied"));

    await expect(run({})).rejects.toThrow("Permission denied");
  });
});
