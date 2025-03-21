import * as fs from "fs/promises";
import * as path from "path";
import { Config } from "../types";

const DEFAULT_CONFIG: Config = {
  changelogFile: "CHANGELOG.md",
  changesDir: "changelog",
  ordering: ["type", "content"],
  types: {
    added: "Added",
    changed: "Changed",
    deprecated: "Deprecated",
    removed: "Removed",
    fixed: "Fixed",
    security: "Security",
    feature: "Feature",
    tweak: "Tweak",
    fix: "Fix",
    compatibility: "Compatibility",
    language: "Language",
  },
  formatter: "keepachangelog",
  versioning: "semver",
};

export async function loadConfig(): Promise<Config> {
  try {
    const packageJsonPath = await findPackageJson();
    if (!packageJsonPath) {
      return DEFAULT_CONFIG;
    }

    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf8"));

    return {
      ...DEFAULT_CONFIG,
      ...(packageJson.changelogger || {}),
    };
  } catch (error) {
    return DEFAULT_CONFIG;
  }
}

async function findPackageJson(
  startDir: string = process.cwd(),
): Promise<string | null> {
  const packageJsonPath = path.join(startDir, "package.json");

  try {
    await fs.access(packageJsonPath);
    return packageJsonPath;
  } catch {
    const parentDir = path.dirname(startDir);
    if (parentDir === startDir) {
      return null;
    }
    return findPackageJson(parentDir);
  }
}
