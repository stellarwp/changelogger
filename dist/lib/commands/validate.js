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
const config_1 = require("../utils/config");
const yaml = __importStar(require("yaml"));
const child_process_1 = require("child_process");
/**
 * Checks if the current directory is a Git repository.
 *
 * @returns boolean indicating if we're in a Git repository
 */
function isGitRepository() {
    try {
        (0, child_process_1.execSync)("git rev-parse --is-inside-work-tree", { stdio: "ignore" });
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Validates changelog entries.
 *
 * This command can be used in two ways:
 * 1. Validate all changelog entries in the changes directory
 * 2. Validate a specific changelog file
 * 3. Validate that at least one changelog was added between two git commits
 *
 * @example
 * ```bash
 * # Validate all change files
 * changelogger validate
 *
 * # Validate a specific file
 * changelogger validate --file changelog/feature-123.yaml
 *
 * # Validate changes between commits
 * changelogger validate --from main --to feature-branch
 * ```
 *
 * @param options - Command options for validation
 * @param options.file - Optional specific file to validate
 * @param options.from - Optional git commit/tag/branch to compare from
 * @param options.to - Optional git commit/tag/branch to compare to
 *
 * @returns A promise that resolves to a string message indicating the validation result
 * @throws {Error} If validation fails, with details about the validation errors
 */
async function run(options = {}) {
    const config = await (0, config_1.loadConfig)();
    const errors = [];
    // If file is specified, validate only that file
    if (options.file) {
        try {
            const content = await fs.readFile(options.file, "utf8");
            const changeFile = yaml.parse(content);
            validateChangeFile(changeFile, options.file, config, errors);
        }
        catch (error) {
            if (error.code === "ENOENT") {
                throw new Error(`File not found: ${options.file}`);
            }
            errors.push(`${options.file}: Invalid YAML format`);
        }
    }
    // If from and to are specified, validate git changes
    else if (options.from && options.to) {
        if (!isGitRepository()) {
            throw new Error("This command must be run from within a Git repository");
        }
        try {
            const changes = (0, child_process_1.execSync)(`git diff --name-only ${options.from} ${options.to}`).toString().split("\n");
            const changelogFiles = changes.filter(file => file.startsWith(config.changesDir) && file.endsWith(".yaml"));
            if (changelogFiles.length === 0) {
                throw new Error(`No changelog entries found between ${options.from} and ${options.to}`);
            }
            for (const file of changelogFiles) {
                const content = await fs.readFile(file, "utf8");
                const changeFile = yaml.parse(content);
                validateChangeFile(changeFile, file, config, errors);
            }
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Git validation failed: ${error.message}`);
            }
            throw error;
        }
    }
    // Validate all files in the changes directory
    else {
        try {
            const files = await fs.readdir(config.changesDir);
            for (const file of files) {
                if (file.startsWith(".") || !file.endsWith(".yaml")) {
                    continue;
                }
                const filePath = path.join(config.changesDir, file);
                const content = await fs.readFile(filePath, "utf8");
                try {
                    const changeFile = yaml.parse(content);
                    validateChangeFile(changeFile, file, config, errors);
                }
                catch (error) {
                    errors.push(`${file}: Invalid YAML format`);
                }
            }
        }
        catch (error) {
            if (error.code === "ENOENT") {
                return "No changes directory found";
            }
            throw error;
        }
    }
    if (errors.length > 0) {
        throw new Error(`Validation failed:\n${errors.join("\n")}`);
    }
    return "All change files are valid";
}
/**
 * Validates a single change file.
 *
 * @param changeFile - The change file to validate
 * @param filename - The name of the file being validated
 * @param config - The configuration object
 * @param errors - Array to collect validation errors
 */
function validateChangeFile(changeFile, filename, config, errors) {
    // Validate significance
    if (!["patch", "minor", "major"].includes(changeFile.significance)) {
        errors.push(`${filename}: Invalid significance "${changeFile.significance}"`);
    }
    // Validate type
    if (!Object.keys(config.types).includes(changeFile.type)) {
        errors.push(`${filename}: Invalid type "${changeFile.type}"`);
    }
    // Validate entry
    if (!changeFile.entry && changeFile.significance !== "patch") {
        errors.push(`${filename}: Entry is required for non-patch changes`);
    }
}
