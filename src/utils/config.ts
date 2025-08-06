import * as fs from "fs/promises";
import { Config } from "../types";

let cachedConfig: Config | null = null;

export const defaultConfig: Config = {
  changelogFile: "changelog.md",
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
  files: [
    {
      path: "changelog.md",
      strategy: "keepachangelog",
    },
  ],
};

/**
 * Gets the formatted label for a given changelog type
 * @param type - The type to get the label for
 * @param config - Optional config to use for type labels. If not provided, uses cached config or default config.
 * @returns The formatted label for the type
 */
export function getTypeLabel(type: string, config?: Config): string {
  const activeConfig = config || cachedConfig || defaultConfig;
  return activeConfig.types[type as keyof typeof activeConfig.types] || type;
}

/**
 * Loads the changelogger configuration from a JSON file
 * @param reload - Whether to force reload the config from file
 * @param filePath - Optional path to the JSON file to load
 * @returns The merged configuration
 */
export async function loadConfig(reload = false, filePath?: string): Promise<Config> {
  // Return cached config if available and not reloading
  if (cachedConfig && !reload) {
    return cachedConfig;
  }

  try {
    // If no file path provided, try to load package.json from current directory
    if (!filePath) {
      filePath = "package.json";
    }

    // Read and parse JSON file
    const fileContents = await fs.readFile(filePath, "utf-8");
    const jsonData = JSON.parse(fileContents);
    const userConfig = jsonData.changelogger || {};

    // Deep merge user config with default config
    const mergedConfig: Config = {
      ...defaultConfig,
      ...userConfig,
      types: {
        ...defaultConfig.types,
        ...userConfig.types,
      },
      files: userConfig.files || defaultConfig.files,
    };

    // Cache the merged config
    cachedConfig = mergedConfig;
    return mergedConfig;
  } catch (error) {
    // If there's an error reading or parsing the file, return default config
    cachedConfig = defaultConfig;
    return defaultConfig;
  }
}
