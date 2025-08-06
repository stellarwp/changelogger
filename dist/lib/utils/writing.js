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
exports.loadWritingStrategy = loadWritingStrategy;
const path = __importStar(require("path"));
async function loadWritingStrategy(formatter) {
    // If it's a file path, try to load it
    if (formatter.endsWith(".js") || formatter.endsWith(".ts")) {
        try {
            const absolutePath = path.resolve(process.cwd(), formatter);
            const module = await Promise.resolve(`${absolutePath}`).then(s => __importStar(require(s)));
            // Validate that the module exports the required methods
            if (typeof module.formatChanges !== "function" ||
                typeof module.formatVersionHeader !== "function" ||
                typeof module.versionHeaderMatcher !== "function" ||
                typeof module.changelogHeaderMatcher !== "function") {
                throw new Error(`Writing strategy file ${formatter} does not export required methods`);
            }
            return module;
        }
        catch (err) {
            const error = err instanceof Error ? err.message : String(err);
            throw new Error(`Failed to load writing strategy file ${formatter}: ${error}`);
        }
    }
    // Handle built-in writing strategies
    switch (formatter) {
        case "keepachangelog":
            return (await Promise.resolve().then(() => __importStar(require("./writing/keepachangelog")))).default;
        case "stellarwp-changelog":
            return (await Promise.resolve().then(() => __importStar(require("./writing/stellarwp-changelog")))).default;
        case "stellarwp-readme":
            return (await Promise.resolve().then(() => __importStar(require("./writing/stellarwp-readme")))).default;
        default:
            throw new Error(`Unknown writing strategy: ${formatter}`);
    }
}
