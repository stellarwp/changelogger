import * as core from "@actions/core";
import { addCommand, validateCommand, writeCommand } from "./main";
import { loadConfig } from "./utils/config";

/**
 * GitHub Actions entry point
 * This function handles the GitHub Actions workflow by processing the inputs
 * and executing the appropriate command.
 */
export async function run(): Promise<void> {
  try {
    // Get GitHub Actions inputs
    const command = core.getInput("command");
    const significance = core.getInput("significance");
    const type = core.getInput("type");
    const entry = core.getInput("entry");
    const version = core.getInput("version");
    const date = core.getInput("date");
    const filename = core.getInput("filename");
    const validateFile = core.getInput("file");
    const validateFrom = core.getInput("from");
    const validateTo = core.getInput("to");

    // Load configuration
    await loadConfig();

    // Execute the appropriate command based on input
    switch (command) {
      case "add":
        if (!significance || !type || !entry) {
          throw new Error("Significance, type, and entry are required for the add command");
        }
        await addCommand({
          significance,
          type,
          entry,
          ...(filename ? { filename } : { autoFilename: true }),
        });
        break;

      case "validate":
        await validateCommand({
          ...(validateFile && { file: validateFile }),
          ...(validateFrom && validateTo && { from: validateFrom, to: validateTo }),
        });
        break;

      case "write":
        if (!version) {
          throw new Error("Version is required for the write command");
        }
        await writeCommand({ overwriteVersion: version, date });
        break;

      default:
        throw new Error(`Unknown command: ${command}`);
    }

    if (core.isDebug()) {
      const debug = {
        command,
        significance,
        type,
        entry,
        filename,
        validateFile,
        validateFrom,
        validateTo,
      };

      await core.summary
        .addHeading("Debug Serialize")
        .addCodeBlock(JSON.stringify(debug, null, 2), "json")
        .write();
    }

    // Set output for GitHub Actions
    core.setOutput("result", "success");
  } catch (error) {
    // Set error output for GitHub Actions
    core.setOutput("result", "error");
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed("An unknown error occurred");
    }
    process.exit(1);
  }
}

// Execute the GitHub Actions workflow
run();
