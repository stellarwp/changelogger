import { run } from "../../src/commands/add";
import * as fs from "fs/promises";
import * as path from "path";
import * as yaml from "yaml";
import { AddCommandOptions } from "../../src/types";
import inquirer from "inquirer";
import { getBranchName } from "../../src/utils/git";

// Mock Date to return a fixed timestamp
const mockTimestamp = 1711072800000; // 2024-03-22T01:00:00.000Z
const mockDate = new Date("2024-03-22T01:00:00.000Z");
const RealDate = Date;
class MockDate extends RealDate {
  constructor() {
    super();
    return mockDate;
  }
  static now() {
    return mockTimestamp;
  }
}
global.Date = MockDate as DateConstructor;

// Mock inquirer
jest.mock("inquirer", () => ({
  prompt: jest.fn(),
}));

// Mock fs/promises
jest.mock("fs/promises");
const mockedFs = fs as jest.Mocked<typeof fs>;

// Mock inquirer
jest.mock("inquirer");
const mockedInquirer = inquirer as jest.Mocked<typeof inquirer>;

// Mock getBranchName
jest.mock("../../src/utils/git");
const mockedGetBranchName = getBranchName as jest.MockedFunction<typeof getBranchName>;

describe("add command", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedInquirer.prompt.mockResolvedValue({});
    mockedGetBranchName.mockResolvedValue("feature/test-branch");
    // By default, file doesn't exist
    mockedFs.access.mockRejectedValue(new Error("File not found"));
  });

  afterAll(() => {
    global.Date = RealDate;
  });

  it("should create a change file with provided options", async () => {
    const options: AddCommandOptions = {
      type: "feature",
      significance: "minor",
      entry: "Test change",
      filename: "test-change",
    };

    const result = await run(options);

    expect(mockedFs.writeFile).toHaveBeenCalled();
    const writeCall = mockedFs.writeFile.mock.calls[0];
    expect(writeCall?.[0]?.toString()).toContain("test-change.yaml");

    const content = yaml.parse(writeCall?.[1] as string);
    expect(content).toMatchObject({
      type: "feature",
      significance: "minor",
      entry: "Test change",
    });
    expect(content.timestamp).toBeDefined();

    expect(result).toContain("Created change file:");
  });

  it("should use branch name as default filename", async () => {
    const options: AddCommandOptions = {
      type: "feature",
      significance: "minor",
      entry: "Test change",
    };

    const result = await run(options);

    expect(mockedFs.writeFile).toHaveBeenCalled();
    const writeCall = mockedFs.writeFile.mock.calls[0];
    expect(writeCall?.[0]?.toString()).toContain("feature-test-branch.yaml");
  });

  it("should handle special characters in filename", async () => {
    const options: AddCommandOptions = {
      type: "feature",
      significance: "minor",
      entry: "Test change",
      filename: "Test @#$% File Name!!!",
    };

    const result = await run(options);

    expect(mockedFs.writeFile).toHaveBeenCalled();
    const writeCall = mockedFs.writeFile.mock.calls[0];
    expect(writeCall?.[0]?.toString()).toContain("test-file-name.yaml");
  });

  it("should handle existing files by adding timestamp", async () => {
    const options: AddCommandOptions = {
      type: "feature",
      significance: "minor",
      entry: "Test change",
      filename: "existing-file",
    };

    // Mock file exists
    mockedFs.access.mockResolvedValue(undefined);

    const result = await run(options);

    expect(mockedFs.writeFile).toHaveBeenCalled();
    const writeCall = mockedFs.writeFile.mock.calls[0];
    expect(writeCall?.[0]?.toString()).toMatch(/existing-file-\d+\.yaml$/);
    expect(result).toContain("File already exists");
  });

  it("should handle missing branch name", async () => {
    mockedGetBranchName.mockResolvedValue("");

    const options: AddCommandOptions = {
      type: "feature",
      significance: "minor",
      entry: "Test change",
    };

    const result = await run(options);

    expect(mockedFs.writeFile).toHaveBeenCalled();
    const writeCall = mockedFs.writeFile.mock.calls[0];
    expect(writeCall?.[0]?.toString()).toMatch(/change-\d+\.yaml$/);
  });

  it("should prompt for missing options", async () => {
    mockedInquirer.prompt.mockResolvedValue({
      type: "feature",
      significance: "minor",
      entry: "Prompted entry",
      filename: "prompted-file",
    });

    const result = await run({});

    expect(mockedInquirer.prompt).toHaveBeenCalled();
    expect(mockedFs.writeFile).toHaveBeenCalled();
    const writeCall = mockedFs.writeFile.mock.calls[0];
    expect(writeCall?.[0]?.toString()).toContain("prompted-file.yaml");

    const content = yaml.parse(writeCall?.[1] as string);
    expect(content).toMatchObject({
      type: "feature",
      significance: "minor",
      entry: "Prompted entry",
    });
  });

  it("should create changes directory if it does not exist", async () => {
    const options: AddCommandOptions = {
      type: "feature",
      significance: "minor",
      entry: "Test change",
      filename: "test-file",
    };

    await run(options);

    expect(mockedFs.mkdir).toHaveBeenCalledWith(expect.any(String), {
      recursive: true,
    });
  });

  it("should validate entry input", async () => {
    await run({});
    const promptConfig = mockedInquirer.prompt.mock.calls[0]?.[0] as Array<{
      name: string;
      validate?: (input: string) => string | boolean;
    }>;
    const entryQuestion = promptConfig.find(q => q.name === "entry");

    expect(entryQuestion?.validate?.("")).toBe("Changelog entry cannot be empty");
    expect(entryQuestion?.validate?.("  ")).toBe("Changelog entry cannot be empty");
    expect(entryQuestion?.validate?.("Valid entry")).toBe(true);
  });

  it("should validate filename input", async () => {
    await run({});
    const promptConfig = mockedInquirer.prompt.mock.calls[0]?.[0] as Array<{
      name: string;
      validate?: (input: string) => string | boolean;
    }>;
    const filenameQuestion = promptConfig.find(q => q.name === "filename");

    expect(filenameQuestion?.validate?.("")).toBe("Filename cannot be empty");
    expect(filenameQuestion?.validate?.("  ")).toBe("Filename cannot be empty");
    expect(filenameQuestion?.validate?.("valid-filename")).toBe(true);
  });

  it("should handle cleanup of complex filenames", async () => {
    const options: AddCommandOptions = {
      type: "feature",
      significance: "minor",
      entry: "Test change",
      filename: "---COMPLEX@#$%^&*()   FILE  ___NAME---",
    };

    await run(options);

    expect(mockedFs.writeFile).toHaveBeenCalled();
    const writeCall = mockedFs.writeFile.mock.calls[0];
    expect(writeCall?.[0]?.toString()).toContain("complex-file-name.yaml");
  });

  it("should handle file system errors", async () => {
    const options: AddCommandOptions = {
      type: "feature",
      significance: "minor",
      entry: "Test change",
      filename: "test-file",
    };

    // Mock fs.writeFile to throw an error
    mockedFs.writeFile.mockRejectedValueOnce(new Error("Write error"));

    await expect(run(options)).rejects.toThrow("Write error");
  });

  it("should handle mkdir errors", async () => {
    const options: AddCommandOptions = {
      type: "feature",
      significance: "minor",
      entry: "Test change",
      filename: "test-file",
    };

    // Mock fs.mkdir to throw an error
    mockedFs.mkdir.mockRejectedValueOnce(new Error("Directory creation error"));

    await expect(run(options)).rejects.toThrow("Directory creation error");
  });
});
