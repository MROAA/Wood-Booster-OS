import compiledConfig from './generated/compiled_config.json';

export interface BoosterverseConfig {
  [key: string]: any;
}

export function getMasterConfig(): BoosterverseConfig {
  return compiledConfig;
}

export function getConfigSection<T>(sectionName: string): T | null {
  const configs = compiledConfig as Record<string, any>;
  return configs[sectionName] ? (configs[sectionName] as T) : null;
}
