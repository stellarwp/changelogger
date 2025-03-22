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
exports.writeCommand = exports.validateCommand = exports.addCommand = exports.loadVersioningStrategy = exports.loadWritingStrategy = exports.loadConfig = exports.stellarStrategy = exports.semverStrategy = exports.stellarwpReadme = exports.stellarwpChangelog = exports.keepachangelog = void 0;
// Import command functions for programmatic usage
const add_1 = require("./commands/add");
Object.defineProperty(exports, "addCommand", { enumerable: true, get: function () { return add_1.run; } });
const validate_1 = require("./commands/validate");
Object.defineProperty(exports, "validateCommand", { enumerable: true, get: function () { return validate_1.run; } });
const write_1 = require("./commands/write");
Object.defineProperty(exports, "writeCommand", { enumerable: true, get: function () { return write_1.run; } });
// Export types
__exportStar(require("./types"), exports);
var keepachangelog_1 = require("./utils/writing/keepachangelog");
Object.defineProperty(exports, "keepachangelog", { enumerable: true, get: function () { return __importDefault(keepachangelog_1).default; } });
var stellarwp_changelog_1 = require("./utils/writing/stellarwp-changelog");
Object.defineProperty(exports, "stellarwpChangelog", { enumerable: true, get: function () { return __importDefault(stellarwp_changelog_1).default; } });
var stellarwp_readme_1 = require("./utils/writing/stellarwp-readme");
Object.defineProperty(exports, "stellarwpReadme", { enumerable: true, get: function () { return __importDefault(stellarwp_readme_1).default; } });
var semver_1 = require("./utils/versioning/semver");
Object.defineProperty(exports, "semverStrategy", { enumerable: true, get: function () { return __importDefault(semver_1).default; } });
var stellarwp_1 = require("./utils/versioning/stellarwp");
Object.defineProperty(exports, "stellarStrategy", { enumerable: true, get: function () { return __importDefault(stellarwp_1).default; } });
// Export utility functions
var config_1 = require("./utils/config");
Object.defineProperty(exports, "loadConfig", { enumerable: true, get: function () { return config_1.loadConfig; } });
var writing_1 = require("./utils/writing");
Object.defineProperty(exports, "loadWritingStrategy", { enumerable: true, get: function () { return writing_1.loadWritingStrategy; } });
var versioning_1 = require("./utils/versioning");
Object.defineProperty(exports, "loadVersioningStrategy", { enumerable: true, get: function () { return versioning_1.loadVersioningStrategy; } });
