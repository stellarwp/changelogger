/**
 * Tests the CLI entry point (src/cli.ts).
 *
 * src/cli.ts is the Commander layer: it declares each command's options and maps
 * them onto the shared command functions in src/commands/. The command functions
 * have their own tests in __tests__/commands/, and the GitHub Action adapter has
 * its own tests in __tests__/github.test.ts.
 *
 * Neither of those exercises Commander, so an option the command function accepts
 * but cli.ts never declares fails only on the CLI. Commander rejects undeclared
 * options with "unknown option", so these tests assert that every documented
 * option reaches the command function.
 */

jest.mock("../src/commands/add");
jest.mock("../src/commands/get-changelog-contents");
jest.mock("../src/commands/validate");
jest.mock("../src/commands/write");

import { run as addCommand } from "../src/commands/add";
import { run as writeCommand } from "../src/commands/write";

const mockedAddCommand = jest.mocked(addCommand);
const mockedWriteCommand = jest.mocked(writeCommand);

const realArgv = process.argv;
const mockExit = jest.spyOn(process, "exit").mockImplementation((() => {}) as never);
const mockLog = jest.spyOn(console, "log").mockImplementation(() => {});
const mockError = jest.spyOn(console, "error").mockImplementation(() => {});
const mockStderr = jest.spyOn(process.stderr, "write").mockImplementation(() => true);

/**
 * Runs src/cli.ts against the given arguments.
 *
 * cli.ts calls program.parse() at module scope, so the module is re-required in
 * isolation per invocation. Commander does not await async action handlers, so
 * the pending handler is flushed before returning.
 *
 * @param argv - The CLI arguments, excluding the node and script argv entries
 */
async function runCli(argv: string[]): Promise<void> {
  process.argv = ["node", "changelogger", ...argv];
  jest.isolateModules(() => {
    require("../src/cli");
  });
  await new Promise(resolve => setImmediate(resolve));
}

describe("cli entry point", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAddCommand.mockResolvedValue({ message: "Created change file", filePath: "changelog/test.yaml" });
    mockedWriteCommand.mockResolvedValue(undefined as never);
  });

  afterAll(() => {
    process.argv = realArgv;
    mockExit.mockRestore();
    mockLog.mockRestore();
    mockError.mockRestore();
    mockStderr.mockRestore();
  });

  describe("add command", () => {
    it("should pass --filename through to the add command", async () => {
      await runCli(["add", "--significance", "patch", "--type", "fix", "--entry", "Fixed a thing", "--filename", "fix-a-thing"]);

      expect(mockExit).not.toHaveBeenCalled();
      expect(mockedAddCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          significance: "patch",
          type: "fix",
          entry: "Fixed a thing",
          filename: "fix-a-thing",
        })
      );
    });

    it("should pass --auto-filename through to the add command", async () => {
      await runCli(["add", "--significance", "minor", "--type", "feature", "--entry", "Added a thing", "--auto-filename"]);

      expect(mockExit).not.toHaveBeenCalled();
      expect(mockedAddCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          significance: "minor",
          type: "feature",
          entry: "Added a thing",
          autoFilename: true,
        })
      );
    });

    it("should accept the short option aliases", async () => {
      await runCli(["add", "-s", "patch", "-t", "fix", "-e", "Fixed a thing"]);

      expect(mockExit).not.toHaveBeenCalled();
      expect(mockedAddCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          significance: "patch",
          type: "fix",
          entry: "Fixed a thing",
        })
      );
    });

    it("should not set filename when the option is omitted", async () => {
      await runCli(["add", "--significance", "patch", "--type", "fix", "--entry", "Fixed a thing"]);

      expect(mockedAddCommand).toHaveBeenCalledWith(expect.not.objectContaining({ filename: expect.anything() }));
    });
  });

  describe("write command", () => {
    it("should pass its options through to the write command", async () => {
      await runCli(["write", "--overwrite-version", "1.2.3", "--dry-run", "--rotate-versions", "5"]);

      expect(mockExit).not.toHaveBeenCalled();
      expect(mockedWriteCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          overwriteVersion: "1.2.3",
          dryRun: true,
          rotateVersions: "5",
        })
      );
    });

    it("should convert --date to an ISO date before calling the write command", async () => {
      await runCli(["write", "--date", "2024-03-20"]);

      expect(mockedWriteCommand).toHaveBeenCalledWith(expect.objectContaining({ date: "2024-03-20" }));
    });
  });
});
