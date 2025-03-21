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
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const stellarwp = {
    formatChanges(version, changes, previousVersion) {
        // Group changes by type
        const groupedChanges = changes.reduce((acc, change) => {
            if (!acc[change.type]) {
                acc[change.type] = [];
            }
            acc[change.type].push(change.entry);
            return acc;
        }, {});
        // Format each type's changes using the original types from the changes
        const sections = Object.entries(groupedChanges)
            .map(([type, entries]) => {
            // Capitalize the first letter of the type
            const formattedType = type.charAt(0).toUpperCase() + type.slice(1);
            return entries
                .map((entry) => `* ${formattedType} - ${entry}`)
                .join("\n");
        })
            .filter((section) => section.length > 0);
        return sections.join("\n");
    },
    formatVersionHeader(version, date, previousVersion) {
        return `= [${version}] ${date} =\n`;
    },
    formatVersionLink(version, previousVersion, template) {
        // StellarWP format doesn't use version links
        return "";
    },
    handleAdditionalFiles(version, date, changes, config) {
        const promises = [];
        // Handle readme.txt
        promises.push((async () => {
            try {
                const readmeTxtPath = path.join(process.cwd(), "readme.txt");
                let readmeTxt = await fs.readFile(readmeTxtPath, "utf8");
                // Generate WordPress-style changelog entry
                const wpEntry = `\n= ${version} - ${date} =\n\n`;
                const formattedChanges = changes.reduce((acc, change) => {
                    const type = config.types[change.type];
                    if (change.entry) {
                        acc.push(`* ${type} - ${change.entry}`);
                    }
                    return acc;
                }, []);
                const wpChanges = formattedChanges.join("\n");
                // Insert after == Changelog == line
                readmeTxt = readmeTxt.replace(/(== Changelog ==\n)/, `$1${wpEntry}${wpChanges}\n`);
                await fs.writeFile(readmeTxtPath, readmeTxt);
            }
            catch (error) {
                if (error.code !== "ENOENT") {
                    throw error;
                }
                // Silently ignore if readme.txt doesn't exist
            }
        })());
        return promises;
    },
};
exports.default = stellarwp;
