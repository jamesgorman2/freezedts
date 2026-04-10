import { describe, it, expect } from 'bun:test';
import { loadConfig, resolveClassOptions } from './config.js';
import type { ResolvedConfig } from './config.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

function withTempDir(fn: (dir: string) => void | Promise<void>) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'freezedts-config-'));
  try {
    return fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true });
  }
}

describe('loadConfig', () => {
  it('returns built-in defaults when no config file exists', () => {
    withTempDir((dir) => {
      const config = loadConfig(path.join(dir, 'freezedts.config.yaml'));
      expect(config).toEqual({
        format: false,
        copyWith: true,
        equal: true,
        toString: true,
      });
    });
  });

  it('reads copyWith: false from yaml config', () => {
    withTempDir((dir) => {
      const configPath = path.join(dir, 'freezedts.config.yaml');
      fs.writeFileSync(configPath, `freezed:\n  options:\n    copyWith: false\n`);

      const config = loadConfig(configPath);
      expect(config.copyWith).toBe(false);
      expect(config.equal).toBe(true);
      expect(config.format).toBe(false);
    });
  });

  it('reads equal: false from yaml config', () => {
    withTempDir((dir) => {
      const configPath = path.join(dir, 'freezedts.config.yaml');
      fs.writeFileSync(configPath, `freezed:\n  options:\n    equal: false\n`);

      const config = loadConfig(configPath);
      expect(config.equal).toBe(false);
      expect(config.copyWith).toBe(true);
    });
  });

  it('reads toString: false from yaml config', () => {
    withTempDir((dir) => {
      const configPath = path.join(dir, 'freezedts.config.yaml');
      fs.writeFileSync(configPath, `freezed:\n  options:\n    toString: false\n`);

      const config = loadConfig(configPath);
      expect(config.toString).toBe(false);
      expect(config.copyWith).toBe(true);
      expect(config.equal).toBe(true);
    });
  });

  it('reads format: true from yaml config', () => {
    withTempDir((dir) => {
      const configPath = path.join(dir, 'freezedts.config.yaml');
      fs.writeFileSync(configPath, `freezed:\n  options:\n    format: true\n`);

      const config = loadConfig(configPath);
      expect(config.format).toBe(true);
    });
  });

  it('reads all options together', () => {
    withTempDir((dir) => {
      const configPath = path.join(dir, 'freezedts.config.yaml');
      fs.writeFileSync(configPath, [
        'freezed:',
        '  options:',
        '    format: true',
        '    copyWith: false',
        '    equal: false',
        '    toString: false',
      ].join('\n'));

      const config = loadConfig(configPath);
      expect(config).toEqual({
        format: true,
        copyWith: false,
        equal: false,
        toString: false,
      });
    });
  });

  it('handles empty yaml file gracefully', () => {
    withTempDir((dir) => {
      const configPath = path.join(dir, 'freezedts.config.yaml');
      fs.writeFileSync(configPath, '');

      const config = loadConfig(configPath);
      expect(config).toEqual({
        format: false,
        copyWith: true,
        equal: true,
        toString: true,
      });
    });
  });

  it('handles yaml with freezed key but no options', () => {
    withTempDir((dir) => {
      const configPath = path.join(dir, 'freezedts.config.yaml');
      fs.writeFileSync(configPath, 'freezed:\n');

      const config = loadConfig(configPath);
      expect(config).toEqual({
        format: false,
        copyWith: true,
        equal: true,
        toString: true,
      });
    });
  });

  it('throws a clear error for invalid YAML', async () => {
    await withTempDir((dir) => {
      const configPath = path.join(dir, 'freezedts.config.yaml');
      fs.writeFileSync(configPath, '{{{{invalid yaml content: [[[');

      expect(() => loadConfig(configPath)).toThrow('invalid YAML');
    });
  });
});

describe('resolveClassOptions', () => {
  const defaultConfig: ResolvedConfig = { format: false, copyWith: true, equal: true, toString: true };
  const disabledConfig: ResolvedConfig = { format: false, copyWith: false, equal: false, toString: false };

  it('uses config values when class options are undefined', () => {
    const result = resolveClassOptions({}, disabledConfig);
    expect(result).toEqual({ copyWith: false, equal: false, toString: false });
  });

  it('per-class true overrides config false', () => {
    const result = resolveClassOptions({ copyWith: true, equal: true, toString: true }, disabledConfig);
    expect(result).toEqual({ copyWith: true, equal: true, toString: true });
  });

  it('per-class false overrides config true', () => {
    const result = resolveClassOptions({ copyWith: false, equal: false, toString: false }, defaultConfig);
    expect(result).toEqual({ copyWith: false, equal: false, toString: false });
  });

  it('mixes per-class and config values', () => {
    const result = resolveClassOptions({ copyWith: false }, defaultConfig);
    expect(result).toEqual({ copyWith: false, equal: true, toString: true });
  });
});
