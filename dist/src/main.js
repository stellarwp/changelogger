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
const core = __importStar(require("@actions/core"));
const add_1 = require("./commands/add");
const validate_1 = require("./commands/validate");
const write_1 = require("./commands/write");
async function run() {
    try {
        const command = core.getInput("command", { required: true });
        const significance = core.getInput("significance");
        const type = core.getInput("type");
        const entry = core.getInput("entry");
        const overwriteVersion = core.getInput("overwrite-version");
        const dryRun = core.getInput("dry-run") === "true";
        const rotateVersions = core.getInput("rotate-versions");
        let result;
        switch (command) {
            case "add":
                result = await (0, add_1.run)({
                    significance,
                    type,
                    entry,
                });
                break;
            case "validate":
                result = await (0, validate_1.run)();
                break;
            case "write":
                result = await (0, write_1.run)({
                    overwriteVersion,
                    dryRun,
                    rotateVersions: rotateVersions
                        ? parseInt(rotateVersions, 10)
                        : undefined,
                });
                break;
            default:
                throw new Error(`Unknown command: ${command}`);
        }
        core.setOutput("result", result);
    }
    catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message);
        }
        else {
            core.setFailed("An unexpected error occurred");
        }
    }
}
run();
