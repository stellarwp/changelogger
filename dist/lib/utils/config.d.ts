import { Config } from "../types";
export declare const defaultConfig: Config;
/**
 * Gets the formatted label for a given changelog type
 * @param type - The type to get the label for
 * @param strategy - The strategy to use for type labels. If not provided, uses the global labels.
 * @param config - Optional config to use for type labels. If not provided, uses cached config or default config.
 * @returns The formatted label for the type
 */
export declare function getTypeLabel(type: string, strategy?: string, config?: Config): string;
/**
 * Loads the changelogger configuration from a JSON file
 * @param reload - Whether to force reload the config from file
 * @param filePath - Optional path to the JSON file to load
 * @returns The merged configuration
 */
export declare function loadConfig(reload?: boolean, filePath?: string): Promise<Config>;
//# sourceMappingURL=config.d.ts.map