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
const config_1 = require("../utils/config");
const writing_1 = require("../utils/writing");
/**
 * Retrieves the already-written changelog contents for a specific version.
 *
 * This command reads a changelog file and extracts the entries (without the
 * version header) for the requested version. It uses the file's configured
 * writing strategy to correctly identify version boundaries.
 *
 * @param options - Command options
 * @param options.version - The version to retrieve contents for
 * @param options.file - Optional path to a specific configured changelog file
 *
 * @returns A promise that resolves to the changelog entries for the version
 * @throws {Error} If the version is not found or the file cannot be read
 */
async function run(options) {
    const config = await (0, config_1.loadConfig)();
    // Determine which file to read from
    let fileConfig;
    if (options.file) {
        fileConfig = config.files.find(f => f.path === options.file);
        if (!fileConfig) {
            throw new Error(`File "${options.file}" is not a configured changelog file. Configured files: ${config.files.map(f => f.path).join(", ")}`);
        }
    }
    else {
        fileConfig = config.files[0];
        if (!fileConfig) {
            throw new Error("No files configured for changelog");
        }
    }
    // Load the writing strategy for this file
    const strategy = await (0, writing_1.loadWritingStrategy)(fileConfig.strategy);
    // Read the file content
    const content = await fs.readFile(fileConfig.path, "utf8");
    // Find the version header
    const versionHeader = strategy.versionHeaderMatcher(content, options.version);
    if (!versionHeader) {
        throw new Error(`Version ${options.version} not found in ${fileConfig.path}`);
    }
    // Find the start of the version section header
    const versionHeaderStart = content.indexOf(versionHeader);
    // Find where the version header line ends
    const headerLineEnd = content.indexOf("\n", versionHeaderStart) + 1;
    // Skip any empty lines after the header
    let contentStart = headerLineEnd;
    while (contentStart < content.length && content[contentStart] === "\n") {
        contentStart++;
    }
    // Get everything after the header (after any blank lines)
    const contentAfterHeader = content.slice(contentStart);
    // Use the strategy's changelogHeaderMatcher to find the next version header
    const nextVersionIndex = strategy.changelogHeaderMatcher(contentAfterHeader);
    let entries;
    if (nextVersionIndex > 0) {
        // Found a next version — extract only entries up to it
        entries = contentAfterHeader.slice(0, nextVersionIndex).trimEnd();
    }
    else {
        // No next version found — all remaining content belongs to this version
        entries = contentAfterHeader.trimEnd();
    }
    return entries;
}
