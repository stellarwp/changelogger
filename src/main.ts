// Import command functions for programmatic usage
import { run as addCommand } from "./commands/add";
import { run as validateCommand } from "./commands/validate";
import { run as writeCommand } from "./commands/write";

import { default as keepachangelog } from "./utils/writing/keepachangelog";
import { default as stellarwpChangelog } from "./utils/writing/stellarwp-changelog";
import { default as stellarwpReadme } from "./utils/writing/stellarwp-readme";

import { default as semverStrategy } from "./utils/versioning/semver";
import { default as stellarStrategy } from "./utils/versioning/stellarwp";

const writingStrategies = {
  keepachangelog,
  stellarwpChangelog,
  stellarwpReadme,
};

// Export writing strategies
export { WritingStrategy } from "./utils/writing";
export { writingStrategies };

// Export types
export * from "./types";

const versioningStrategies = {
  semverStrategy,
  stellarStrategy,
};

// Export versioning strategies
export { VersioningStrategy } from "./utils/versioning";
export { versioningStrategies };

// Export utility functions
export { loadConfig } from "./utils/config";
export { loadWritingStrategy } from "./utils/writing";
export { loadVersioningStrategy } from "./utils/versioning";

// Export command functions for programmatic usage
export { addCommand, validateCommand, writeCommand };
