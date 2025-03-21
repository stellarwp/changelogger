"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const keepachangelog = {
    formatChanges(version, changes, previousVersion) {
        // Group changes by type
        const groupedChanges = changes.reduce((acc, change) => {
            if (!acc[change.type]) {
                acc[change.type] = [];
            }
            acc[change.type].push(change.entry);
            return acc;
        }, {});
        // Format each type's changes
        const sections = Object.entries(groupedChanges).map(([type, entries]) => {
            const title = type.charAt(0).toUpperCase() + type.slice(1);
            const items = entries.map((entry) => `- ${entry}`).join("\n");
            return `### ${title}\n${items}`;
        });
        return sections.join("\n\n");
    },
    formatVersionHeader(version, date, previousVersion) {
        return `## [${version}] - ${date}`;
    },
    formatVersionLink(version, previousVersion, template) {
        if (!template)
            return "";
        const link = template
            .replace("${old}", previousVersion)
            .replace("${new}", version);
        return `[${version}]: ${link}`;
    },
};
exports.default = keepachangelog;
