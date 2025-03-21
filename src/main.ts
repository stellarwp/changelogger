import * as core from "@actions/core";
import { run as addCommand } from "./commands/add";
import { run as validateCommand } from "./commands/validate";
import { run as writeCommand } from "./commands/write";

async function run(): Promise<void> {
  try {
    const command = core.getInput("command", { required: true });
    const significance = core.getInput("significance");
    const type = core.getInput("type");
    const entry = core.getInput("entry");
    const version = core.getInput("version");
    const githubToken = core.getInput("github-token");

    let result: string;

    switch (command) {
      case "add":
        result = await addCommand({
          significance,
          type,
          entry,
          githubToken,
        });
        break;
      case "validate":
        result = await validateCommand();
        break;
      case "write":
        result = await writeCommand({
          version,
          githubToken,
        });
        break;
      default:
        throw new Error(`Unknown command: ${command}`);
    }

    core.setOutput("result", result);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed("An unexpected error occurred");
    }
  }
}

run();
