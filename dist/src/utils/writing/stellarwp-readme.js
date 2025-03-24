"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../config");
const stellarwpReadme = {
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
            const formattedType = (0, config_1.getTypeLabel)(type);
            return entries.map(entry => `* ${formattedType} - ${entry}`).join("\n");
        })
            .filter(section => section.length > 0);
        return sections.join("\n");
    },
    formatVersionHeader(version, date, previousVersion) {
        return `\n= [${version}] ${date} =\n\n`;
    },
    formatVersionLink(version, previousVersion, template) {
        // StellarWP format doesn't use version links
        return "";
    },
    versionHeaderMatcher(content, version) {
        // Match StellarWP version headers
        const versionRegex = new RegExp(`^(= \\[${version}\\] (?:[^=])+ =)$`, "m");
        const match = content.match(versionRegex);
        return match ? match[1].trim() : undefined;
    },
    changelogHeaderMatcher(content) {
        // Find the position after the first version header
        const firstVersionMatch = content.match(/^= \[[^\]]+\] [^=]+ =$/m);
        if (!firstVersionMatch) {
            // If no version header found, find the position after the main header
            const mainHeaderMatch = content.match(/^== Changelog ==$/m);
            return mainHeaderMatch ? mainHeaderMatch.index + mainHeaderMatch[0].length + 1 : 0;
        }
        return firstVersionMatch.index;
    },
};
exports.default = stellarwpReadme;
