#!/usr/bin/env node

import { Command } from "commander";
import { run as addCommand } from "./commands/add";
import { run as validateCommand } from "./commands/validate";
import { run as writeCommand } from "./commands/write";

const program = new Command();

program
  .name("changelogger")
  .description("A tool for managing changelogs through change files")
  .version("0.1.0");

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
  .option("-v, --version <version>", "The version to use")
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
