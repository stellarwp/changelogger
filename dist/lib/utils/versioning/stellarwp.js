"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function parseVersion(version) {
    const [major = 0, minor = 0, patch = 0, hotfix = 0] = version.split(".").map(Number);
    return { major, minor, patch, hotfix };
}
function formatVersion(version) {
    const base = `${version.major}.${version.minor}.${version.patch}`;
    return version.hotfix > 0 ? `${base}.${version.hotfix}` : base;
}
const stellarStrategy = {
    getNextVersion(currentVersion, significance) {
        const version = parseVersion(currentVersion);
        switch (significance) {
            case "major":
                return formatVersion({
                    major: version.major + 1,
                    minor: 0,
                    patch: 0,
                    hotfix: 0,
                });
            case "minor":
                return formatVersion({
                    ...version,
                    minor: version.minor + 1,
                    patch: 0,
                    hotfix: 0,
                });
            case "patch":
                // If we have a hotfix, increment that
                if (version.hotfix > 0) {
                    return formatVersion({
                        ...version,
                        hotfix: version.hotfix + 1,
                    });
                }
                // Otherwise increment patch
                return formatVersion({
                    ...version,
                    patch: version.patch + 1,
                    hotfix: 0,
                });
            default:
                return currentVersion;
        }
    },
    isValidVersion(version) {
        const parts = version.split(".");
        // Accept both 3-part and 4-part versions
        if (parts.length < 3 || parts.length > 4)
            return false;
        return parts.every(part => {
            const num = Number(part);
            return Number.isInteger(num) && num >= 0;
        });
    },
    compareVersions(v1, v2) {
        const version1 = parseVersion(v1);
        const version2 = parseVersion(v2);
        // Compare each part in order of significance
        const comparisons = [version1.major - version2.major, version1.minor - version2.minor, version1.patch - version2.patch, version1.hotfix - version2.hotfix];
        // Return the first non-zero comparison
        return comparisons.find(c => c !== 0) || 0;
    },
};
exports.default = stellarStrategy;
