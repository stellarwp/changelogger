"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const semver = __importStar(require("semver"));
const yaml = __importStar(require("yaml"));
const config_1 = require("../utils/config");
const writing_1 = require("../utils/writing");
/**
 * Ensures a directory exists, creating it if it doesn't.
 *
 * @param dirPath - Path to the directory
 */
async function ensureDirectoryExists(dirPath) {
    // Skip if the path is '.' or empty (root directory)
    if (dirPath === "." || !dirPath)
        return;
    try {
        await fs.access(dirPath);
    }
    catch {
        await fs.mkdir(dirPath, { recursive: true });
    }
}
/**
 * Ensures a file exists with default content if it doesn't.
 *
 * @param filePath - Path to the file
 * @param defaultContent - Default content to write if file doesn't exist
 */
async function ensureFileExists(filePath, defaultContent) {
    try {
        await fs.access(filePath);
    }
    catch {
        // Ensure the directory exists before creating the file
        const dirPath = path.dirname(filePath);
        await ensureDirectoryExists(dirPath);
        await fs.writeFile(filePath, defaultContent, "utf8");
    }
}
/**
 * Writes changelog entries to the configured files.
 *
 * This command is part of the CLI tool and handles the process of:
 * 1. Reading all YAML change files from the changes directory
 * 2. Determining the next version number based on change significance (if not specified)
 * 3. Writing the changes to each configured file using its specific writing strategy
 * 4. Cleaning up processed change files
 *
 * The command can be used in three ways:
 * 1. Automatic versioning: When no version is specified, it will determine the next version
 * 2. Manual versioning: When a version is specified with --overwrite-version
 * 3. Dry run: When --dry-run is specified, it will show what would be written without making changes
 *
 * @example
 * ```bash
 * # Automatic versioning
 * changelogger write
 *
 * # Manual versioning
 * changelogger write --overwrite-version 1.2.3
 *
 * # Dry run - show what would be written without making changes
 * changelogger write --dry-run
 * ```
 *
 * @param options - Command options for controlling the write process
 * @param options.overwriteVersion - Optional version number to use instead of auto-determining
 * @param options.dryRun - If true, only show what would be written without making changes
 *
 * @returns A promise that resolves to a string message indicating the result
 * @throws {Error} If there are issues with file operations or invalid inputs
 */
async function run(options) {
    const config = await (0, config_1.loadConfig)();
    const changes = [];
    let processedFiles = [];
    // Ensure changes directory exists
    await ensureDirectoryExists(config.changesDir);
    // Read all change files
    try {
        const files = await fs.readdir(config.changesDir);
        processedFiles = files;
        for (const file of files) {
            if (!file.endsWith(".yaml"))
                continue;
            const content = await fs.readFile(path.join(config.changesDir, file), "utf8");
            const change = yaml.parse(content);
            changes.push(change);
        }
    }
    catch (error) {
        throw new Error(`Failed to read change files: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
    // Sort changes by significance
    changes.sort((a, b) => {
        const significanceOrder = { major: 0, minor: 1, patch: 2 };
        return (significanceOrder[a.significance] - significanceOrder[b.significance]);
    });
    // Determine version and date
    const date = options.date || new Date().toISOString().split("T")[0];
    let version = options.overwriteVersion;
    if (!version) {
        // Get current version from the first file
        const firstFile = config.files[0];
        const currentVersion = await getCurrentVersion(firstFile.path);
        const significance = determineSignificance(changes);
        version = getNextVersion(currentVersion, significance);
    }
    // Validate version format
    if (!semver.valid(version)) {
        throw new Error(`Invalid version format: ${version}`);
    }
    // Load writing strategy
    const strategy = await (0, writing_1.loadWritingStrategy)(config.formatter);
    // If dry run, show what would be written and exit
    if (options.dryRun) {
        console.log("\n[DRY RUN] Would write the following changes:");
        console.log("==========================================");
        // Show what would be written for each file
        for (const file of config.files) {
            console.log(`\nFile: ${file.path}`);
            console.log("------------------------------------------");
            // Load the specific writing strategy for this file
            const fileStrategy = await (0, writing_1.loadWritingStrategy)(file.strategy);
            const content = await fs
                .readFile(file.path, "utf8")
                .catch(() => "# Changelog\n\n");
            const previousVersion = fileStrategy.versionHeaderMatcher(content, version);
            // Format the new changelog entry
            const header = fileStrategy.formatVersionHeader(version, date, previousVersion);
            const changesText = fileStrategy.formatChanges(version, changes, previousVersion);
            const link = previousVersion && fileStrategy.formatVersionLink
                ? fileStrategy.formatVersionLink(version, previousVersion, config.linkTemplate)
                : "";
            const entry = `${header}${link}${changesText}`;
            console.log(entry);
        }
        console.log("\n==========================================");
        return "Dry run completed - no changes were made";
    }
    // Process each file
    for (const file of config.files) {
        // Ensure the file exists with default content
        const defaultContent = "# Changelog\n\n";
        await ensureFileExists(file.path, defaultContent);
        const content = await fs.readFile(file.path, "utf8");
        const previousVersion = strategy.versionHeaderMatcher(content, version);
        // Format the new changelog entry
        const header = strategy.formatVersionHeader(version, date, previousVersion);
        const changesText = strategy.formatChanges(version, changes, previousVersion);
        const link = previousVersion && strategy.formatVersionLink
            ? strategy.formatVersionLink(version, previousVersion, config.linkTemplate)
            : "";
        const newEntry = `${header}\n${link}\n${changesText}\n`;
        // Find where to insert the new entry
        const insertIndex = strategy.changelogHeaderMatcher(content);
        // Insert the new entry
        const newContent = content.slice(0, insertIndex) + newEntry + content.slice(insertIndex);
        await fs.writeFile(file.path, newContent, "utf8");
        // Handle any additional files
        if (strategy.handleAdditionalFiles) {
            const additionalPromises = strategy.handleAdditionalFiles(version, date, changes, config, options);
            await Promise.all(additionalPromises);
        }
    }
    // Clean up processed files
    for (const file of processedFiles) {
        if (file.endsWith(".yaml")) {
            await fs.unlink(path.join(config.changesDir, file));
        }
    }
    return `Successfully wrote changelog for version ${version}`;
}
/**
 * Gets the current version from a file.
 *
 * @param filePath - Path to the file
 * @returns The current version string
 */
async function getCurrentVersion(filePath) {
    try {
        const content = await fs.readFile(filePath, "utf8");
        // Try StellarWP format first
        let match = content.match(/= \[([^\]]+)\]/);
        if (!match) {
            // Try Keep a Changelog format
            match = content.match(/## \[([^\]]+)\]/);
        }
        return match ? match[1] : "0.1.0";
    }
    catch (error) {
        if (error.code === "ENOENT") {
            return "0.1.0";
        }
        throw error;
    }
}
/**
 * Determines the overall significance of a set of changes.
 *
 * @param changes - Array of change files
 * @returns The highest significance level among the changes
 */
function determineSignificance(changes) {
    if (changes.some((c) => c.significance === "major"))
        return "major";
    if (changes.some((c) => c.significance === "minor"))
        return "minor";
    return "patch";
}
/**
 * Gets the next version number based on the current version and significance.
 *
 * @param currentVersion - The current version string
 * @param significance - The significance of the changes
 * @returns The next version string
 */
function getNextVersion(currentVersion, significance) {
    const version = semver.valid(currentVersion) || "0.1.0";
    return semver.inc(version, significance) || "0.1.0";
}
