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
const core = __importStar(require("@actions/core"));
const main_1 = require("./main");
const config_1 = require("./utils/config");
/**
 * GitHub Actions entry point
 * This function handles the GitHub Actions workflow by processing the inputs
 * and executing the appropriate command.
 */
async function run() {
    try {
        // Get GitHub Actions inputs
        const command = core.getInput("command");
        const significance = core.getInput("significance");
        const type = core.getInput("type");
        const entry = core.getInput("entry");
        const version = core.getInput("version");
        const date = core.getInput("date");
        const filename = core.getInput("filename");
        const validateFile = core.getInput("validate-file");
        const validateFrom = core.getInput("validate-from");
        const validateTo = core.getInput("validate-to");
        // Load configuration
        await (0, config_1.loadConfig)();
        // Execute the appropriate command based on input
        switch (command) {
            case "add":
                if (!significance || !type || !entry) {
                    throw new Error("Significance, type, and entry are required for the add command");
                }
                await (0, main_1.addCommand)({
                    significance,
                    type,
                    entry,
                    ...(filename ? { filename } : { autoFilename: true }),
                });
                break;
            case "validate":
                await (0, main_1.validateCommand)({
                    ...(validateFile && { file: validateFile }),
                    ...(validateFrom && validateTo && { from: validateFrom, to: validateTo }),
                });
                break;
            case "write":
                if (!version) {
                    throw new Error("Version is required for the write command");
                }
                await (0, main_1.writeCommand)({ overwriteVersion: version, date });
                break;
            default:
                throw new Error(`Unknown command: ${command}`);
        }
        // Set output for GitHub Actions
        core.setOutput("result", "success");
    }
    catch (error) {
        // Set error output for GitHub Actions
        core.setOutput("result", "error");
        if (error instanceof Error) {
            core.setFailed(error.message);
        }
        else {
            core.setFailed("An unknown error occurred");
        }
        process.exit(1);
    }
}
// Execute the GitHub Actions workflow
run();
