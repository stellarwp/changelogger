import * as path from "path";
import { Significance } from "../types";

export interface VersioningStrategy {
  /**
   * Get the next version based on the current version and significance
   */
  getNextVersion: (currentVersion: string, significance: Significance) => string;

  /**
   * Validate if a version string is valid
   */
  isValidVersion: (version: string) => boolean;

  /**
   * Compare two versions
   * Returns:
   * - negative if v1 < v2
   * - 0 if v1 === v2
   * - positive if v1 > v2
   */
  compareVersions: (v1: string, v2: string) => number;
}

export async function loadVersioningStrategy(versioning: string): Promise<VersioningStrategy> {
  // If it's a file path, try to load it
  if (versioning.endsWith(".js") || versioning.endsWith(".ts")) {
    try {
      const absolutePath = path.resolve(process.cwd(), versioning);
      const module = await import(absolutePath);

      // Validate that the module exports the required methods
      if (typeof module.getNextVersion !== "function" || typeof module.isValidVersion !== "function" || typeof module.compareVersions !== "function") {
        throw new Error(`Versioning file ${versioning} does not export required methods`);
      }

      return module as VersioningStrategy;
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to load versioning file ${versioning}: ${error}`);
    }
  }

  // Handle built-in versioning strategies
  if (versioning === "semver") {
    const semver = await import("semver");
    return {
      getNextVersion: (currentVersion: string, significance: Significance) => {
        const version = semver.valid(semver.coerce(currentVersion));
        if (!version) throw new Error(`Invalid version: ${currentVersion}`);

        switch (significance) {
          case "major":
            return semver.inc(version, "major") || version;
          case "minor":
            return semver.inc(version, "minor") || version;
          case "patch":
            return semver.inc(version, "patch") || version;
          default:
            return version;
        }
      },
      isValidVersion: (version: string) => Boolean(semver.valid(semver.coerce(version))),
      compareVersions: (v1: string, v2: string) => {
        const version1 = semver.valid(semver.coerce(v1));
        const version2 = semver.valid(semver.coerce(v2));
        if (!version1 || !version2) throw new Error("Invalid version comparison");
        return semver.compare(version1, version2);
      },
    };
  }

  if (versioning === "stellarwp") {
    const stellarStrategy = await import("./versioning/stellarwp");
    return stellarStrategy.default;
  }

  throw new Error(`Unknown versioning strategy: ${versioning}`);
}
