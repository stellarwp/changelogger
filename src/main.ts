// Import command functions for programmatic usage
import { run as addCommand } from "./commands/add";
import { run as validateCommand } from "./commands/validate";
import { run as writeCommand } from "./commands/write";

// Export types
export * from "./types";

// Export writing strategies
export { WritingStrategy } from "./utils/writing";
export { default as keepachangelog } from "./utils/writing/keepachangelog";
export { default as stellarwpChangelog } from "./utils/writing/stellarwp-changelog";
export { default as stellarwpReadme } from "./utils/writing/stellarwp-readme";

// Export versioning strategies
export { VersioningStrategy } from "./utils/versioning";
export { default as semverStrategy } from "./utils/versioning/semver";
export { default as stellarStrategy } from "./utils/versioning/stellarwp";

// Export utility functions
export { loadConfig } from "./utils/config";
export { loadWritingStrategy } from "./utils/writing";
export { loadVersioningStrategy } from "./utils/versioning";

// Export command functions for programmatic usage
export { addCommand, validateCommand, writeCommand };
