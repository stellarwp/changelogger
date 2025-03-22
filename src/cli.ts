#!/usr/bin/env node

import { Command } from "commander";
import { run as addCommand } from "./commands/add";
import { run as validateCommand } from "./commands/validate";
import { run as writeCommand } from "./commands/write";
import { readFileSync } from "fs";
import { join } from "path";

const program = new Command();

// Get version from package.json
const packageJson = JSON.parse(
  readFileSync(join(__dirname, "..", "..", "package.json"), "utf8"),
);

program
  .name("changelogger")
  .description(
    "A TypeScript-based changelog management tool that works both as a GitHub Action and CLI tool",
  )
  .version(packageJson.version);

// Add commands
program
  .command("add")
  .description("Add a new changelog entry")
  .option(
    "-s, --significance <type>",
    "The significance of the change (patch, minor, major)",
  )
  .option(
    "-t, --type <type>",
    "The type of change (added, changed, deprecated, removed, fixed, security)",
  )
  .option("-e, --entry <text>", "The changelog entry text")
  .action(async (options) => {
    try {
      const result = await addCommand(options);
      console.log(result);
    } catch (error) {
      console.error(
        "Error:",
        error instanceof Error ? error.message : "An unexpected error occurred",
      );
      process.exit(1);
    }
  });

program
  .command("validate")
  .description("Validate all change files")
  .action(async () => {
    try {
      const result = await validateCommand();
      console.log(result);
    } catch (error) {
      console.error(
        "Error:",
        error instanceof Error ? error.message : "An unexpected error occurred",
      );
      process.exit(1);
    }
  });

program
  .command("write")
  .description("Write changes to the changelog file")
  .option("-o, --overwrite-version <version>", "The version to use")
  .option("--dry-run", "Show what would be written without making changes")
  .option(
    "--rotate-versions <number>",
    "Number of versions to keep in additional files (e.g. readme.txt). Does not affect changelog.md",
  )
  .action(async (options) => {
    try {
      const result = await writeCommand(options);
      console.log(result);
    } catch (error) {
      console.error(
        "Error:",
        error instanceof Error ? error.message : "An unexpected error occurred",
      );
      process.exit(1);
    }
  });

program.parse();
