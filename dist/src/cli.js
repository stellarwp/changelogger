#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const add_1 = require("./commands/add");
const validate_1 = require("./commands/validate");
const write_1 = require("./commands/write");
const program = new commander_1.Command();
program
    .name("changelogger")
    .description("A tool for managing changelogs through change files")
    .version("0.1.0");
program
    .command("add")
    .description("Add a new changelog entry")
    .option("-s, --significance <type>", "The significance of the change (patch, minor, major)")
    .option("-t, --type <type>", "The type of change (added, changed, deprecated, removed, fixed, security)")
    .option("-e, --entry <text>", "The changelog entry text")
    .action(async (options) => {
    try {
        const result = await (0, add_1.run)(options);
        console.log(result);
    }
    catch (error) {
        console.error("Error:", error instanceof Error ? error.message : "An unexpected error occurred");
        process.exit(1);
    }
});
program
    .command("validate")
    .description("Validate all change files")
    .action(async () => {
    try {
        const result = await (0, validate_1.run)();
        console.log(result);
    }
    catch (error) {
        console.error("Error:", error instanceof Error ? error.message : "An unexpected error occurred");
        process.exit(1);
    }
});
program
    .command("write")
    .description("Write changes to the changelog file")
    .option("-v, --version <version>", "The version to use")
    .action(async (options) => {
    try {
        const result = await (0, write_1.run)(options);
        console.log(result);
    }
    catch (error) {
        console.error("Error:", error instanceof Error ? error.message : "An unexpected error occurred");
        process.exit(1);
    }
});
program.parse();
