#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const add_1 = require("./commands/add");
const validate_1 = require("./commands/validate");
const write_1 = require("./commands/write");
const fs_1 = require("fs");
const path_1 = require("path");
const locutus_1 = require("locutus");
const program = new commander_1.Command();
// Get version from package.json
const packageJson = JSON.parse((0, fs_1.readFileSync)((0, path_1.join)(__dirname, "..", "package.json"), "utf8"));
program
    .name("changelogger")
    .description("A TypeScript-based changelog management tool that works both as a GitHub Action and CLI tool")
    .version(packageJson.version);
// Add commands
program
    .command("add")
    .description("Add a new changelog entry")
    .option("-s, --significance <type>", "The significance of the change (patch, minor, major)")
    .option("-t, --type <type>", "The type of change (added, changed, deprecated, removed, fixed, security)")
    .option("-e, --entry <text>", "The changelog entry text")
    .option("--auto-filename", "Automatically generate the filename based on the branch name")
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
    .option("-o, --overwrite-version <version>", "The version to use")
    .option("--dry-run", "Show what would be written without making changes")
    .option("--rotate-versions <number>", "Number of versions to keep in additional files (e.g. readme.txt). Does not affect changelog.md")
    .option("--date <date>", "Custom date to use for the changelog entry (supports PHP strtotime format)")
    .action(async (options) => {
    try {
        // Parse the date using strtotime if provided
        if (options.date) {
            const timestamp = locutus_1.php.datetime.strtotime(options.date);
            if (timestamp === false) {
                throw new Error(`Invalid date format: ${options.date}`);
            }
            options.date = new Date(timestamp * 1000).toISOString().split("T")[0];
        }
        const result = await (0, write_1.run)(options);
        console.log(result);
    }
    catch (error) {
        console.error("Error:", error instanceof Error ? error.message : "An unexpected error occurred");
        process.exit(1);
    }
});
program.parse();
