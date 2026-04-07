import * as fs from 'node:fs';
import { parse as parseYaml } from 'yaml';

export interface ResolvedConfig {
  format: boolean;
  copyWith: boolean;
  equal: boolean;
}

interface FreezedConfigFile {
  freezed?: {
    options?: {
      format?: boolean;
      copyWith?: boolean;
      equal?: boolean;
    };
  };
}

export const DEFAULTS: ResolvedConfig = {
  format: false,
  copyWith: true,
  equal: true,
};

export function loadConfig(configPath: string): ResolvedConfig {
  let raw: string;
  try {
    raw = fs.readFileSync(configPath, 'utf-8');
  } catch {
    return { ...DEFAULTS };
  }

  let parsed: FreezedConfigFile | null;
  try {
    parsed = parseYaml(raw) as FreezedConfigFile | null;
  } catch {
    throw new Error(`freezedts: invalid YAML in config file: ${configPath}`);
  }
  const options = parsed?.freezed?.options;

  return {
    format: options?.format ?? DEFAULTS.format,
    copyWith: options?.copyWith ?? DEFAULTS.copyWith,
    equal: options?.equal ?? DEFAULTS.equal,
  };
}

export function resolveClassOptions(
  cls: { copyWith?: boolean; equal?: boolean },
  config: ResolvedConfig,
): { copyWith: boolean; equal: boolean } {
  return {
    copyWith: cls.copyWith ?? config.copyWith,
    equal: cls.equal ?? config.equal,
  };
}
