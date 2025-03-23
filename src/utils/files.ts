import * as fs from "fs/promises";
import * as path from "path";

/**
 * Finds the nearest package.json file by traversing up the directory tree
 * @returns The path to the package.json file, or null if not found
 */
export async function findPackageJson(): Promise<string | null> {
  let currentDir = process.cwd();

  while (currentDir !== path.parse(currentDir).root) {
    try {
      const packageJsonPath = path.join(currentDir, "package.json");
      await fs.access(packageJsonPath);
      return packageJsonPath;
    } catch {
      // File doesn't exist, try parent directory
      currentDir = path.dirname(currentDir);
    }
  }

  return null;
}
