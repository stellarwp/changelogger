import { run as addCommand } from "./commands/add";
import { run as validateCommand } from "./commands/validate";
import { run as writeCommand } from "./commands/write";
declare const writingStrategies: {
    keepachangelog: import("./utils/writing").WritingStrategy;
    stellarwpChangelog: import("./utils/writing").WritingStrategy;
    stellarwpReadme: import("./utils/writing").WritingStrategy;
};
export { WritingStrategy } from "./utils/writing";
export { writingStrategies };
export * from "./types";
declare const versioningStrategies: {
    semverStrategy: import("./utils/versioning").VersioningStrategy;
    stellarStrategy: import("./utils/versioning").VersioningStrategy;
};
export { VersioningStrategy } from "./utils/versioning";
export { versioningStrategies };
export { loadConfig, defaultConfig, getTypeLabel } from "./utils/config";
export { loadWritingStrategy } from "./utils/writing";
export { loadVersioningStrategy } from "./utils/versioning";
export { addCommand, validateCommand, writeCommand };
//# sourceMappingURL=main.d.ts.map