import { run } from "../../src/commands/validate";
import * as fs from "fs/promises";
import * as path from "path";
import * as yaml from "yaml";
import { ChangeFile } from "../../src/types";

// Mock fs/promises
jest.mock("fs/promises");
const mockedFs = fs as jest.Mocked<typeof fs>;

describe("validate command", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should validate a valid change file", async () => {
    const validChange: ChangeFile = {
      type: "feature",
      significance: "patch",
      entry: "Added new feature",
    };

    // Mock reading a valid change file
    mockedFs.readdir.mockResolvedValue(["change1.yaml"] as any);
    mockedFs.readFile.mockResolvedValue(yaml.stringify(validChange));

    const result = await run();
    expect(result).toBe("All change files are valid");
  });

  it("should throw error for invalid change type", async () => {
    const invalidChange = {
      type: "invalid",
      significance: "patch",
      entry: "Invalid type",
    };

    mockedFs.readdir.mockResolvedValue(["change1.yaml"] as any);
    mockedFs.readFile.mockResolvedValue(yaml.stringify(invalidChange));

    await expect(run()).rejects.toThrow('Invalid type "invalid"');
  });

  it("should throw error for invalid significance", async () => {
    const invalidChange = {
      type: "feature",
      significance: "invalid",
      entry: "Invalid significance",
    };

    mockedFs.readdir.mockResolvedValue(["change1.yaml"] as any);
    mockedFs.readFile.mockResolvedValue(yaml.stringify(invalidChange));

    await expect(run()).rejects.toThrow('Invalid significance "invalid"');
  });

  it("should throw error for missing entry in non-patch change", async () => {
    const invalidChange = {
      type: "feature",
      significance: "minor",
    };

    mockedFs.readdir.mockResolvedValue(["change1.yaml"] as any);
    mockedFs.readFile.mockResolvedValue(yaml.stringify(invalidChange));

    await expect(run()).rejects.toThrow("Entry is required for non-patch changes");
  });

  it("should handle empty directory", async () => {
    mockedFs.readdir.mockResolvedValue([]);

    const result = await run();
    expect(result).toBe("All change files are valid");
  });

  it("should handle non-existent directory", async () => {
    mockedFs.readdir.mockRejectedValue({ code: "ENOENT" });

    const result = await run();
    expect(result).toBe("No changes directory found");
  });

  it("should ignore non-yaml files", async () => {
    mockedFs.readdir.mockResolvedValue(["change1.txt", ".change2.yaml", "change3.yaml"] as any);
    mockedFs.readFile.mockResolvedValue(
      yaml.stringify({
        type: "feature",
        significance: "patch",
        entry: "Valid change",
      })
    );

    const result = await run();
    expect(result).toBe("All change files are valid");
  });
});
