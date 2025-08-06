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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeCommand = exports.validateCommand = exports.addCommand = exports.loadVersioningStrategy = exports.loadWritingStrategy = exports.getTypeLabel = exports.defaultConfig = exports.loadConfig = exports.versioningStrategies = exports.writingStrategies = void 0;
// Import command functions for programmatic usage
const add_1 = require("./commands/add");
Object.defineProperty(exports, "addCommand", { enumerable: true, get: function () { return add_1.run; } });
const validate_1 = require("./commands/validate");
Object.defineProperty(exports, "validateCommand", { enumerable: true, get: function () { return validate_1.run; } });
const write_1 = require("./commands/write");
Object.defineProperty(exports, "writeCommand", { enumerable: true, get: function () { return write_1.run; } });
const keepachangelog_1 = __importDefault(require("./utils/writing/keepachangelog"));
const stellarwp_changelog_1 = __importDefault(require("./utils/writing/stellarwp-changelog"));
const stellarwp_readme_1 = __importDefault(require("./utils/writing/stellarwp-readme"));
const semver_1 = __importDefault(require("./utils/versioning/semver"));
const stellarwp_1 = __importDefault(require("./utils/versioning/stellarwp"));
const writingStrategies = {
    keepachangelog: keepachangelog_1.default,
    stellarwpChangelog: stellarwp_changelog_1.default,
    stellarwpReadme: stellarwp_readme_1.default,
};
exports.writingStrategies = writingStrategies;
// Export types
__exportStar(require("./types"), exports);
const versioningStrategies = {
    semverStrategy: semver_1.default,
    stellarStrategy: stellarwp_1.default,
};
exports.versioningStrategies = versioningStrategies;
// Export utility functions
var config_1 = require("./utils/config");
Object.defineProperty(exports, "loadConfig", { enumerable: true, get: function () { return config_1.loadConfig; } });
Object.defineProperty(exports, "defaultConfig", { enumerable: true, get: function () { return config_1.defaultConfig; } });
Object.defineProperty(exports, "getTypeLabel", { enumerable: true, get: function () { return config_1.getTypeLabel; } });
var writing_1 = require("./utils/writing");
Object.defineProperty(exports, "loadWritingStrategy", { enumerable: true, get: function () { return writing_1.loadWritingStrategy; } });
var versioning_1 = require("./utils/versioning");
Object.defineProperty(exports, "loadVersioningStrategy", { enumerable: true, get: function () { return versioning_1.loadVersioningStrategy; } });
