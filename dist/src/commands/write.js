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
async function run(options) {
    const config = await (0, config_1.loadConfig)();
    const changes = [];
    // Read all change files
    try {
        const files = await fs.readdir(config.changesDir);
        for (const file of files) {
            if (file.startsWith(".") || !file.endsWith(".yaml")) {
                continue;
            }
            const filePath = path.join(config.changesDir, file);
            const content = await fs.readFile(filePath, "utf8");
            const change = yaml.parse(content);
            changes.push(change);
        }
    }
    catch (error) {
        if (error.code === "ENOENT") {
            return "No changes directory found";
        }
        throw error;
    }
    if (changes.length === 0) {
        return "No changes to write";
    }
    // Determine version bump
    let version = options.version;
    if (!version) {
        const currentVersion = await getCurrentVersion(config.changelogFile);
        const significance = determineSignificance(changes);
        version = getNextVersion(currentVersion, significance);
    }
    // Group changes by type
    const groupedChanges = changes.reduce((acc, change) => {
        const type = config.types[change.type];
        acc[type] = acc[type] || [];
        acc[type].push(change.entry);
        return acc;
    }, {});
    // Generate changelog entry
    const date = new Date().toISOString().split("T")[0];
    let entry = `\n## [${version}] - ${date}\n`;
    for (const [type, entries] of Object.entries(groupedChanges)) {
        entry += `\n### ${type}\n`;
        for (const text of entries) {
            if (text) {
                entry += `- ${text}\n`;
            }
        }
    }
    // Update changelog file
    try {
        let changelog = await fs.readFile(config.changelogFile, "utf8");
        changelog = changelog.replace(/^(# Change Log\n)/, `$1${entry}`);
        await fs.writeFile(config.changelogFile, changelog);
    }
    catch (error) {
        if (error.code === "ENOENT") {
            const header = "# Change Log\n\nAll notable changes to this project will be documented in this file.\n";
            await fs.writeFile(config.changelogFile, header + entry);
        }
        else {
            throw error;
        }
    }
    // Load and use the writing strategy
    const strategy = await (0, writing_1.loadWritingStrategy)(config.formatter);
    // Handle additional files if the strategy supports it
    if (strategy.handleAdditionalFiles) {
        const filePromises = strategy.handleAdditionalFiles(version, date, changes, config);
        await Promise.all(filePromises);
    }
    // Clean up change files
    for (const file of await fs.readdir(config.changesDir)) {
        if (!file.startsWith(".") && file.endsWith(".yaml")) {
            await fs.unlink(path.join(config.changesDir, file));
        }
    }
    return `Updated ${config.changelogFile} to version ${version}`;
}
async function getCurrentVersion(changelogFile) {
    try {
        const content = await fs.readFile(changelogFile, "utf8");
        const match = content.match(/## \[([^\]]+)\]/);
        return match ? match[1] : "0.1.0";
    }
    catch {
        return "0.1.0";
    }
}
function determineSignificance(changes) {
    if (changes.some((c) => c.significance === "major"))
        return "major";
    if (changes.some((c) => c.significance === "minor"))
        return "minor";
    return "patch";
}
function getNextVersion(currentVersion, significance) {
    const version = semver.valid(currentVersion) || "0.1.0";
    return semver.inc(version, significance) || "0.1.0";
}
