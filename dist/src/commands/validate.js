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
/**
 * Validates all changelog entries in the changes directory.
 *
 * This command is part of the CLI tool and performs validation checks on all YAML files
 * in the changes directory. It ensures that:
 * 1. All files are valid YAML
 * 2. Each change file has the required fields
 * 3. The significance value is valid (patch, minor, or major)
 * 4. The type value is valid according to the configuration
 * 5. Non-patch changes have an entry description
 *
 * @example
 * ```bash
 * # Validate all change files
 * changelogger validate
 * ```
 *
 * @returns A promise that resolves to a string message indicating the validation result
 * @throws {Error} If validation fails, with details about the validation errors
 */
async function run() {
    const config = await (0, config_1.loadConfig)();
    const errors = [];
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
                // Validate significance
                if (!["patch", "minor", "major"].includes(changeFile.significance)) {
                    errors.push(`${file}: Invalid significance "${changeFile.significance}"`);
                }
                // Validate type
                if (!Object.keys(config.types).includes(changeFile.type)) {
                    errors.push(`${file}: Invalid type "${changeFile.type}"`);
                }
                // Validate entry
                if (!changeFile.entry && changeFile.significance !== "patch") {
                    errors.push(`${file}: Entry is required for non-patch changes`);
                }
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
    if (errors.length > 0) {
        throw new Error(`Validation failed:\n${errors.join("\n")}`);
    }
    return "All change files are valid";
}
