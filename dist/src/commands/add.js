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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const inquirer_1 = __importDefault(require("inquirer"));
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const yaml = __importStar(require("yaml"));
const config_1 = require("../utils/config");
const git_1 = require("../utils/git");
/**
 * Cleans up a string to be used as a filename
 * - Converts to lowercase
 * - Replaces non-alphanumeric characters with hyphens
 * - Removes leading/trailing hyphens
 * - Collapses multiple hyphens into one
 */
function cleanupFilename(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .replace(/-{2,}/g, "-");
}
async function run(options) {
    const config = await (0, config_1.loadConfig)();
    // Get the default filename from the branch name
    const branchName = await (0, git_1.getBranchName)();
    const defaultFilename = branchName
        ? cleanupFilename(branchName.replace(/\//g, "-"))
        : `change-${Date.now()}`;
    // If not all options are provided, prompt for them
    const answers = await inquirer_1.default.prompt([
        {
            type: "list",
            name: "significance",
            message: "What is the significance of this change?",
            choices: ["patch", "minor", "major"],
            when: !options.significance,
        },
        {
            type: "list",
            name: "type",
            message: "What type of change is this?",
            choices: Object.keys(config.types),
            when: !options.type,
        },
        {
            type: "input",
            name: "entry",
            message: "Enter the changelog entry:",
            when: !options.entry,
            validate: (input) => {
                if (!input.trim()) {
                    return "Changelog entry cannot be empty";
                }
                return true;
            },
            editor: false,
        },
        {
            type: "input",
            name: "filename",
            message: "Enter the filename for the change (without extension):",
            default: defaultFilename.replace(/\.yaml$/, ""),
            when: !options.filename,
            validate: (input) => {
                if (!input.trim()) {
                    return "Filename cannot be empty";
                }
                return true;
            },
            editor: false,
        },
    ]);
    const changeFile = {
        significance: (options.significance ||
            answers.significance),
        type: (options.type || answers.type),
        entry: options.entry || answers.entry || "",
        timestamp: new Date().toISOString(),
    };
    // Create changes directory if it doesn't exist
    await fs.mkdir(config.changesDir, { recursive: true });
    // Use provided filename or the one from prompt, with a fallback to timestamp
    const baseFilename = options.filename || answers.filename || defaultFilename;
    const filename = `${cleanupFilename(baseFilename)}`;
    const filePath = path.join(config.changesDir, `${filename}.yaml`);
    // Check if file exists
    try {
        await fs.access(filePath);
        // File exists, add timestamp
        const timestamp = Date.now();
        const newFilename = `${filename}-${timestamp}.yaml`;
        const newFilePath = path.join(config.changesDir, newFilename);
        await fs.writeFile(newFilePath, yaml.stringify(changeFile));
        return `File already exists. Created change file with timestamp: ${newFilePath}`;
    }
    catch (error) {
        // File doesn't exist, proceed with original filename
        await fs.writeFile(filePath, yaml.stringify(changeFile));
        return `Created change file: ${filePath}`;
    }
}
