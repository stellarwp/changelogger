"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../config");
const keepachangelog = {
    formatChanges(version, changes, previousVersion) {
        // Group changes by type
        const groupedChanges = changes.reduce((acc, change) => {
            if (!acc[change.type]) {
                acc[change.type] = [];
            }
            acc[change.type]?.push(change.entry);
            return acc;
        }, {});
        // Format each type's changes
        const sections = Object.entries(groupedChanges).map(([type, entries]) => {
            const title = (0, config_1.getTypeLabel)(type);
            const items = entries.map(entry => `- ${entry}`).join("\n");
            return `### ${title}\n${items}`;
        });
        return sections.join("\n\n");
    },
    formatVersionHeader(version, date, previousVersion) {
        return `## [${version}] - ${date}`;
    },
    formatVersionLink(version, previousVersion, template) {
        if (!template) {
            return "";
        }
        const link = template.replace("${old}", previousVersion).replace("${new}", version);
        return `[${version}]: ${link}`;
    },
    versionHeaderMatcher(content, version) {
        // Match Keep a Changelog version headers
        const versionRegex = new RegExp(`^(## \\[${version}\\] - (?:[^\n]+))$`, "m");
        const match = content.match(versionRegex);
        return match ? match[1] : undefined;
    },
    changelogHeaderMatcher(content) {
        // Find the position after the first version header
        const firstVersionMatch = content.match(/^## \[[^\]]+\] - [^\n]+$/m);
        if (!firstVersionMatch) {
            // If no version header found, find the position after the main header
            const mainHeaderMatch = content.match(/^# Changelog$/m);
            return mainHeaderMatch ? mainHeaderMatch.index + mainHeaderMatch[0].length + 1 : 0;
        }
        return firstVersionMatch.index;
    },
};
exports.default = keepachangelog;
