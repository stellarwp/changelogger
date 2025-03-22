import { Significance } from "../../types";
import { VersioningStrategy } from "../versioning";
import * as semver from "semver";

const semverStrategy: VersioningStrategy = {
  getNextVersion(currentVersion: string, significance: Significance): string {
    switch (significance) {
      case "major":
        return semver.inc(currentVersion, "major") || currentVersion;
      case "minor":
        return semver.inc(currentVersion, "minor") || currentVersion;
      case "patch":
        return semver.inc(currentVersion, "patch") || currentVersion;
      default:
        return currentVersion;
    }
  },

  isValidVersion(version: string): boolean {
    return semver.valid(version) !== null;
  },

  compareVersions(v1: string, v2: string): number {
    return semver.compare(v1, v2);
  },
};

export default semverStrategy;
