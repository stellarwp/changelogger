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
exports.loadVersioningStrategy = loadVersioningStrategy;
const path = __importStar(require("path"));
async function loadVersioningStrategy(versioning) {
    // If it's a file path, try to load it
    if (versioning.endsWith(".js") || versioning.endsWith(".ts")) {
        try {
            const absolutePath = path.resolve(process.cwd(), versioning);
            const module = await Promise.resolve(`${absolutePath}`).then(s => __importStar(require(s)));
            // Validate that the module exports the required methods
            if (typeof module.getNextVersion !== "function" ||
                typeof module.isValidVersion !== "function" ||
                typeof module.compareVersions !== "function") {
                throw new Error(`Versioning file ${versioning} does not export required methods`);
            }
            return module;
        }
        catch (err) {
            const error = err instanceof Error ? err.message : String(err);
            throw new Error(`Failed to load versioning file ${versioning}: ${error}`);
        }
    }
    // Handle built-in versioning strategies
    if (versioning === "semver") {
        const semver = await Promise.resolve().then(() => __importStar(require("semver")));
        return {
            getNextVersion: (currentVersion, significance) => {
                const version = semver.valid(semver.coerce(currentVersion));
                if (!version)
                    throw new Error(`Invalid version: ${currentVersion}`);
                switch (significance) {
                    case "major":
                        return semver.inc(version, "major") || version;
                    case "minor":
                        return semver.inc(version, "minor") || version;
                    case "patch":
                        return semver.inc(version, "patch") || version;
                    default:
                        return version;
                }
            },
            isValidVersion: (version) => Boolean(semver.valid(semver.coerce(version))),
            compareVersions: (v1, v2) => {
                const version1 = semver.valid(semver.coerce(v1));
                const version2 = semver.valid(semver.coerce(v2));
                if (!version1 || !version2)
                    throw new Error("Invalid version comparison");
                return semver.compare(version1, version2);
            },
        };
    }
    if (versioning === "stellarwp") {
        const stellarStrategy = await Promise.resolve().then(() => __importStar(require("./versioning/stellarwp")));
        return stellarStrategy.default;
    }
    throw new Error(`Unknown versioning strategy: ${versioning}`);
}
