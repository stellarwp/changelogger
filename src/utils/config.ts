import * as fs from "fs/promises";
import * as path from "path";
import { ChangeType, Config } from "../types";

let cachedConfig: Config | null = null;

export const defaultConfig: Config = {
  changelogFile: "changelog.md",
  changesDir: "changelog",
  ordering: ["type", "content"],
  types: {
    compatibility: "Compatibility",
    deprecated: "Deprecated",
    feature: "Feature",
    fix: "Fix",
    language: "Language",
    removed: "Removed",
    security: "Security",
    tweak: "Tweak",
  },
  typeLabelOverrides: {
    keepachangelog: {
      feature: "Added",
      fix: "Fixed",
      tweak: "Changed",
    },
    "stellarwp-changelog": {
      fix: "Fix",
    },
    "stellarwp-readme": {
      fix: "Fix",
    },
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
 * @param strategy - The strategy to use for type labels. If not provided, uses the global labels.
 * @param config - Optional config to use for type labels. If not provided, uses cached config or default config.
 * @returns The formatted label for the type
 */
export function getTypeLabel(type: string, strategy?: string, config?: Config): string {
  const activeConfig = config || cachedConfig || defaultConfig;

  if (typeof strategy === "string" && activeConfig?.typeLabelOverrides?.[strategy]?.[type as ChangeType]) {
    return activeConfig.typeLabelOverrides[strategy][type as ChangeType] || type;
  }

  return activeConfig.types[type as ChangeType] || type;
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
    // If no file path provided, try to load package.json from current working directory
    if (!filePath) {
      filePath = path.join(process.cwd(), "package.json");
    }

    // Read and parse JSON file
    const fileContents = await fs.readFile(filePath, "utf-8");
    const jsonData = JSON.parse(fileContents);
    const userConfig = jsonData.changelogger || {};

    const mergedTypes = {
      ...defaultConfig.types,
      ...userConfig.types,
    };

    // Sort types alphabetically by key.
    const types = Object.keys(mergedTypes)
      .sort()
      .reduce(
        (accumulator, key) => {
          accumulator[key as ChangeType] = mergedTypes[key];
          return accumulator;
        },
        {} as Record<ChangeType, string>
      );

    const typeLabelOverrides = {
      ...defaultConfig.typeLabelOverrides,
      ...userConfig.typeLabelOverrides,
    };

    // Deep merge user config with default config
    const mergedConfig: Config = {
      ...defaultConfig,
      ...userConfig,
      types,
      typeLabelOverrides,
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
