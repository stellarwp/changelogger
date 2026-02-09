/**
 * Tests the GitHub Action entry point (src/github.ts).
 *
 * The project has three separate entry points, each bundled independently via ncc:
 *   - dist/index.js    (library, from src/main.ts via build:package)
 *   - dist/cli.js      (CLI, from src/cli.ts via build:cli)
 *   - dist/gha/index.js (GitHub Action, from src/github.ts via build:gha)
 *
 * action.yml references dist/gha/index.js as the Action's entry point. This file
 * is a thin adapter that reads @actions/core inputs, maps them to the shared
 * command functions exported by src/main.ts, and sets @actions/core outputs.
 *
 * These tests verify the adapter logic (input parsing, command routing, output
 * setting, and error handling) independently from the command implementations,
 * which have their own tests in __tests__/commands/.
 */

// Mocks are hoisted before imports by Jest
jest.mock("@actions/core");
jest.mock("../src/main");
jest.mock("../src/utils/config");

// Spy on process.exit before the auto-invocation in github.ts resolves
const mockExit = jest.spyOn(process, "exit").mockImplementation((() => {}) as never);

import * as core from "@actions/core";
import { run } from "../src/github";
import { addCommand, getChangelogContentsCommand, validateCommand, writeCommand } from "../src/main";
import { loadConfig } from "../src/utils/config";

const mockedCore = jest.mocked(core);
const mockedAddCommand = jest.mocked(addCommand);
const mockedValidateCommand = jest.mocked(validateCommand);
const mockedWriteCommand = jest.mocked(writeCommand);
const mockedGetChangelogContentsCommand = jest.mocked(getChangelogContentsCommand);
const mockedLoadConfig = jest.mocked(loadConfig);

/**
 * Helper to configure core.getInput mock to return specific values per input name.
 */
function mockInputs(inputs: Record<string, string>): void {
  mockedCore.getInput.mockImplementation((name: string) => inputs[name] ?? "");
}

describe("github action entry point", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Restore default mock implementations
    mockedLoadConfig.mockResolvedValue({} as any);
    mockedAddCommand.mockResolvedValue("Created change file");
    mockedValidateCommand.mockResolvedValue("All change files are valid");
    mockedWriteCommand.mockResolvedValue(undefined as any);
    mockedGetChangelogContentsCommand.mockResolvedValue("changelog contents");
    mockedCore.isDebug.mockReturnValue(false);
    mockedCore.getBooleanInput.mockReturnValue(false);
    mockExit.mockClear();
  });

  afterAll(() => {
    mockExit.mockRestore();
  });

  describe("add command", () => {
    it("should call addCommand with significance, type, entry, and filename", async () => {
      mockInputs({
        command: "add",
        significance: "minor",
        type: "feature",
        entry: "New feature",
        filename: "my-feature",
      });

      await run();

      expect(mockedAddCommand).toHaveBeenCalledWith({
        significance: "minor",
        type: "feature",
        entry: "New feature",
        filename: "my-feature",
      });
      expect(mockedCore.setOutput).toHaveBeenCalledWith("result", "success");
    });

    it("should use autoFilename when filename is empty", async () => {
      mockInputs({
        command: "add",
        significance: "minor",
        type: "feature",
        entry: "New feature",
      });

      await run();

      expect(mockedAddCommand).toHaveBeenCalledWith({
        significance: "minor",
        type: "feature",
        entry: "New feature",
        autoFilename: true,
      });
    });

    it("should error when significance is missing", async () => {
      mockInputs({
        command: "add",
        type: "feature",
        entry: "New feature",
      });

      await run();

      expect(mockedCore.setFailed).toHaveBeenCalledWith("Significance, type, and entry are required for the add command");
      expect(mockedCore.setOutput).toHaveBeenCalledWith("result", "error");
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it("should error when type is missing", async () => {
      mockInputs({
        command: "add",
        significance: "minor",
        entry: "New feature",
      });

      await run();

      expect(mockedCore.setFailed).toHaveBeenCalledWith("Significance, type, and entry are required for the add command");
    });

    it("should error when entry is missing", async () => {
      mockInputs({
        command: "add",
        significance: "minor",
        type: "feature",
      });

      await run();

      expect(mockedCore.setFailed).toHaveBeenCalledWith("Significance, type, and entry are required for the add command");
    });
  });

  describe("validate command", () => {
    it("should call validateCommand with no options when no inputs provided", async () => {
      mockInputs({ command: "validate" });

      await run();

      expect(mockedValidateCommand).toHaveBeenCalledWith({});
      expect(mockedCore.setOutput).toHaveBeenCalledWith("result", "success");
    });

    it("should call validateCommand with file when provided", async () => {
      mockInputs({
        command: "validate",
        file: "changelog/test.yaml",
      });

      await run();

      expect(mockedValidateCommand).toHaveBeenCalledWith({
        file: "changelog/test.yaml",
      });
    });

    it("should call validateCommand with from and to when both provided", async () => {
      mockInputs({
        command: "validate",
        from: "abc123",
        to: "def456",
      });

      await run();

      expect(mockedValidateCommand).toHaveBeenCalledWith({
        from: "abc123",
        to: "def456",
      });
    });

    it("should not pass from/to when only from is provided", async () => {
      mockInputs({
        command: "validate",
        from: "abc123",
      });

      await run();

      expect(mockedValidateCommand).toHaveBeenCalledWith({});
    });

    it("should not pass from/to when only to is provided", async () => {
      mockInputs({
        command: "validate",
        to: "def456",
      });

      await run();

      expect(mockedValidateCommand).toHaveBeenCalledWith({});
    });

    it("should pass both file and from/to when all provided", async () => {
      mockInputs({
        command: "validate",
        file: "changelog/test.yaml",
        from: "abc123",
        to: "def456",
      });

      await run();

      expect(mockedValidateCommand).toHaveBeenCalledWith({
        file: "changelog/test.yaml",
        from: "abc123",
        to: "def456",
      });
    });
  });

  describe("write command", () => {
    it("should call writeCommand with version and date", async () => {
      mockInputs({
        command: "write",
        version: "1.2.3",
        date: "2024-01-01",
      });

      await run();

      expect(mockedWriteCommand).toHaveBeenCalledWith({
        overwriteVersion: "1.2.3",
        date: "2024-01-01",
      });
      expect(mockedCore.setOutput).toHaveBeenCalledWith("result", "success");
    });

    it("should call writeCommand with version and empty date", async () => {
      mockInputs({
        command: "write",
        version: "1.2.3",
      });

      await run();

      expect(mockedWriteCommand).toHaveBeenCalledWith({
        overwriteVersion: "1.2.3",
        date: "",
      });
    });

    it("should error when version is missing", async () => {
      mockInputs({ command: "write" });

      await run();

      expect(mockedCore.setFailed).toHaveBeenCalledWith("Version is required for the write command");
      expect(mockedCore.setOutput).toHaveBeenCalledWith("result", "error");
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe("get-changelog-contents command", () => {
    it("should call getChangelogContentsCommand and set changelog output", async () => {
      mockInputs({
        command: "get-changelog-contents",
        version: "1.2.3",
      });
      mockedGetChangelogContentsCommand.mockResolvedValue("## Added\n- Feature");

      await run();

      expect(mockedGetChangelogContentsCommand).toHaveBeenCalledWith({
        version: "1.2.3",
      });
      expect(mockedCore.setOutput).toHaveBeenCalledWith("changelog", "## Added\n- Feature");
      expect(mockedCore.setOutput).toHaveBeenCalledWith("result", "success");
    });

    it("should pass file option when provided", async () => {
      mockInputs({
        command: "get-changelog-contents",
        version: "1.2.3",
        file: "readme.txt",
      });

      await run();

      expect(mockedGetChangelogContentsCommand).toHaveBeenCalledWith({
        version: "1.2.3",
        file: "readme.txt",
      });
    });

    it("should pass html option when true", async () => {
      mockInputs({
        command: "get-changelog-contents",
        version: "1.2.3",
      });
      mockedCore.getBooleanInput.mockReturnValue(true);

      await run();

      expect(mockedGetChangelogContentsCommand).toHaveBeenCalledWith({
        version: "1.2.3",
        html: true,
      });
    });

    it("should not pass html option when false", async () => {
      mockInputs({
        command: "get-changelog-contents",
        version: "1.2.3",
      });
      mockedCore.getBooleanInput.mockReturnValue(false);

      await run();

      expect(mockedGetChangelogContentsCommand).toHaveBeenCalledWith({
        version: "1.2.3",
      });
    });

    it("should error when version is missing", async () => {
      mockInputs({ command: "get-changelog-contents" });

      await run();

      expect(mockedCore.setFailed).toHaveBeenCalledWith("Version is required for the get-changelog-contents command");
      expect(mockedCore.setOutput).toHaveBeenCalledWith("result", "error");
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe("unknown command", () => {
    it("should error for unknown command", async () => {
      mockInputs({ command: "unknown-cmd" });

      await run();

      expect(mockedCore.setFailed).toHaveBeenCalledWith("Unknown command: unknown-cmd");
      expect(mockedCore.setOutput).toHaveBeenCalledWith("result", "error");
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe("error handling", () => {
    it("should handle Error instances from command functions", async () => {
      mockInputs({
        command: "add",
        significance: "minor",
        type: "feature",
        entry: "test",
      });
      mockedAddCommand.mockRejectedValue(new Error("Command failed"));

      await run();

      expect(mockedCore.setFailed).toHaveBeenCalledWith("Command failed");
      expect(mockedCore.setOutput).toHaveBeenCalledWith("result", "error");
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it("should handle non-Error throws from command functions", async () => {
      mockInputs({
        command: "add",
        significance: "minor",
        type: "feature",
        entry: "test",
      });
      mockedAddCommand.mockRejectedValue("string error");

      await run();

      expect(mockedCore.setFailed).toHaveBeenCalledWith("An unknown error occurred");
      expect(mockedCore.setOutput).toHaveBeenCalledWith("result", "error");
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe("debug mode", () => {
    it("should write summary when isDebug returns true", async () => {
      mockInputs({ command: "validate" });
      mockedCore.isDebug.mockReturnValue(true);

      const mockSummary = {
        addHeading: jest.fn().mockReturnThis(),
        addCodeBlock: jest.fn().mockReturnThis(),
        write: jest.fn().mockResolvedValue(undefined),
      };
      Object.defineProperty(mockedCore, "summary", { value: mockSummary, writable: true });

      await run();

      expect(mockSummary.addHeading).toHaveBeenCalledWith("Debug Serialize");
      expect(mockSummary.addCodeBlock).toHaveBeenCalled();
      expect(mockSummary.write).toHaveBeenCalled();
    });

    it("should not write summary when isDebug returns false", async () => {
      mockInputs({ command: "validate" });
      mockedCore.isDebug.mockReturnValue(false);

      const mockSummary = {
        addHeading: jest.fn().mockReturnThis(),
        addCodeBlock: jest.fn().mockReturnThis(),
        write: jest.fn().mockResolvedValue(undefined),
      };
      Object.defineProperty(mockedCore, "summary", { value: mockSummary, writable: true });

      await run();

      expect(mockSummary.addHeading).not.toHaveBeenCalled();
    });
  });

  describe("config loading", () => {
    it("should call loadConfig before executing commands", async () => {
      mockInputs({ command: "validate" });

      await run();

      expect(mockedLoadConfig).toHaveBeenCalled();
    });
  });
});
