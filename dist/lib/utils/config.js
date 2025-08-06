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
exports.defaultConfig = void 0;
exports.getTypeLabel = getTypeLabel;
exports.loadConfig = loadConfig;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
let cachedConfig = null;
exports.defaultConfig = {
    changelogFile: "changelog.md",
    changesDir: "changelog",
    ordering: ["type", "content"],
    types: {
        added: "Added",
        changed: "Changed",
        deprecated: "Deprecated",
        removed: "Removed",
        fixed: "Fixed",
        security: "Security",
        feature: "Feature",
        tweak: "Tweak",
        fix: "Fix",
        compatibility: "Compatibility",
        language: "Language",
    },
    formatter: "keepachangelog",
    versioning: "semver",
    files: [
        {
            path: "changelog.md",
            strategy: "keepachangelog",
        },
    ],
};
/**
 * Gets the formatted label for a given changelog type
 * @param type - The type to get the label for
 * @param config - Optional config to use for type labels. If not provided, uses cached config or default config.
 * @returns The formatted label for the type
 */
function getTypeLabel(type, config) {
    const activeConfig = config || cachedConfig || exports.defaultConfig;
    return activeConfig.types[type] || type;
}
/**
 * Loads the changelogger configuration from a JSON file
 * @param reload - Whether to force reload the config from file
 * @param filePath - Optional path to the JSON file to load
 * @returns The merged configuration
 */
async function loadConfig(reload = false, filePath) {
    // Return cached config if available and not reloading
    if (cachedConfig && !reload) {
        return cachedConfig;
    }
    try {
        // If no file path provided, try to load package.json from current working directory
        if (!filePath) {
            filePath = path.join(process.cwd(), "package.json");
        }
        // Read and parse JSON file
        const fileContents = await fs.readFile(filePath, "utf-8");
        const jsonData = JSON.parse(fileContents);
        const userConfig = jsonData.changelogger || {};
        // Deep merge user config with default config
        const mergedConfig = {
            ...exports.defaultConfig,
            ...userConfig,
            types: {
                ...exports.defaultConfig.types,
                ...userConfig.types,
            },
            files: userConfig.files || exports.defaultConfig.files,
        };
        // Cache the merged config
        cachedConfig = mergedConfig;
        return mergedConfig;
    }
    catch (error) {
        // If there's an error reading or parsing the file, return default config
        cachedConfig = exports.defaultConfig;
        return exports.defaultConfig;
    }
}
