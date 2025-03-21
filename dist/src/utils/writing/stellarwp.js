"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
        // Define the order of types
        const typeOrder = ["Feature", "Tweak", "Fix", "Compatibility", "Language"];
        // Format each type's changes
        const sections = typeOrder
            .filter((type) => groupedChanges[type.toLowerCase()])
            .map((type) => {
            const entries = groupedChanges[type.toLowerCase()];
            return entries.map((entry) => `* ${type} - ${entry}`).join("\n");
        })
            .filter((section) => section.length > 0);
        // Add language section if there are changes
        const languageSection = "* Language - 0 new strings added, 0 updated, 0 fuzzied, and 0 obsoleted.";
        return [...sections, languageSection].join("\n");
    },
    formatVersionHeader(version, date, previousVersion) {
        return `= [${version}] ${date} =\n`;
    },
    formatVersionLink(version, previousVersion, template) {
        // StellarWP format doesn't use version links
        return "";
    },
};
exports.default = stellarwp;
