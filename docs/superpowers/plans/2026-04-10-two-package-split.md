# Two-Package Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split freezedts into two npm packages — `freezedts` (zero-dependency runtime) and `freezedts-cli` (code generator CLI) — using npm workspaces.

**Architecture:** Create a `packages/` directory with two sub-packages. The root becomes a private workspace root. Source files move from `src/` into their respective packages. Tests stay at root. Config switches from YAML to JSON.

**Tech Stack:** TypeScript 6, npm workspaces, bun:test

---

## File Map

**Created:**
- `packages/freezedts/package.json`
- `packages/freezedts/tsconfig.json`
- `packages/freezedts/src/index.ts`
- `packages/freezedts/src/runtime/index.ts`
- `packages/freezedts/src/runtime/freezed.ts`
- `packages/freezedts/src/runtime/copy.ts`
- `packages/freezedts/src/runtime/deepEqual.ts`
- `packages/freezedts/src/runtime/deepFreeze.ts`
- `packages/freezedts/src/runtime/freezed.test.ts`
- `packages/freezedts/src/runtime/copy.test.ts`
- `packages/freezedts-cli/package.json`
- `packages/freezedts-cli/tsconfig.json`
- `packages/freezedts-cli/src/cli.ts`
- `packages/freezedts-cli/src/excluded-dirs.ts`
- `packages/freezedts-cli/src/cli.test.ts`
- `packages/freezedts-cli/src/generator/config.ts`
- `packages/freezedts-cli/src/generator/emitter.ts`
- `packages/freezedts-cli/src/generator/generator.ts`
- `packages/freezedts-cli/src/generator/parser.ts`
- `packages/freezedts-cli/src/generator/watcher.ts`
- `packages/freezedts-cli/src/generator/config.test.ts`
- `packages/freezedts-cli/src/generator/emitter.test.ts`
- `packages/freezedts-cli/src/generator/generator.test.ts`
- `packages/freezedts-cli/src/generator/parser.test.ts`
- `packages/freezedts-cli/src/generator/watcher.test.ts`
- `tsconfig.base.json`

**Modified:**
- `package.json` (root — becomes private workspace root)
- `tsconfig.test.json` (updated paths)
- `tests/immutability/immutability.test.ts` (import path)
- `tests/shallow-copy/shallow-copy.test.ts` (import path)
- `tests/deep-copy/deep-copy.test.ts` (import path)
- `tests/equality/equality.test.ts` (import path)
- `tests/equality/map-set-equality.test.ts` (import path)
- `tests/equality/nan-equality.test.ts` (import path)
- `tests/equality/nullable-freezed.test.ts` (import path)
- `tests/collections/collections.test.ts` (import path)
- `tests/toString/toString.test.ts` (import path)
- `tests/field-config/field-config.test.ts` (import path)
- `tests/config/config.test.ts` (import path)
- `tests/cross-file/cross-file.test.ts` (import path)
- `tests/interface-params/interface-params.test.ts` (import path)
- `tests/transitive-dependencies/transitive-dependencies.test.ts` (import path)
- `.github/workflows/node.js.yml` (build command)
- `README.md` (installation, config, build instructions)

**Deleted:**
- `src/` (entire directory — contents moved to packages)
- `tsconfig.json` (replaced by `tsconfig.base.json`)

---

### Task 1: Create the packages directory structure and package.json files

**Files:**
- Create: `packages/freezedts/package.json`
- Create: `packages/freezedts-cli/package.json`
- Modify: `package.json` (root)

- [ ] **Step 1: Create the root workspace package.json**

Replace the root `package.json` with:

```json
{
  "private": true,
  "workspaces": ["packages/*"],
  "engines": { "node": ">=22" },
  "scripts": {
    "build": "npm run build --workspaces",
    "test": "bun test",
    "test:watch": "bun test --watch",
    "generate": "bun packages/freezedts-cli/src/cli.ts"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "@types/node": "^25.5.2",
    "typescript": "^6.0.2"
  }
}
```

- [ ] **Step 2: Create `packages/freezedts/package.json`**

```json
{
  "name": "freezedts",
  "version": "0.13.0",
  "type": "module",
  "engines": { "node": ">=22" },
  "description": "Immutable class management for TypeScript via code generation",
  "author": { "name": "James  Gorman" },
  "homepage": "https://github.com/jamesgorman2/freezedts",
  "bugs": { "url": "https://github.com/jamesgorman2/freezedts/issues" },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/jamesgorman2/freezedts.git"
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./runtime": {
      "import": "./dist/runtime/index.js",
      "types": "./dist/runtime/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsc"
  },
  "files": ["dist", "!dist/**/*.test.*"],
  "keywords": ["immutable", "codegen", "decorator", "typescript"],
  "license": "MIT",
  "dependencies": {}
}
```

- [ ] **Step 3: Create `packages/freezedts-cli/package.json`**

```json
{
  "name": "freezedts-cli",
  "version": "0.13.0",
  "type": "module",
  "engines": { "node": ">=22" },
  "description": "Code generator CLI for freezedts",
  "author": { "name": "James  Gorman" },
  "homepage": "https://github.com/jamesgorman2/freezedts",
  "bugs": { "url": "https://github.com/jamesgorman2/freezedts/issues" },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/jamesgorman2/freezedts.git"
  },
  "bin": {
    "freezedts": "dist/cli.js"
  },
  "scripts": {
    "build": "tsc"
  },
  "files": ["dist", "!dist/**/*.test.*"],
  "keywords": ["immutable", "codegen", "decorator", "typescript", "cli"],
  "license": "MIT",
  "dependencies": {
    "freezedts": "^0.13.0",
    "ts-morph": "^27.0.2"
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add package.json packages/freezedts/package.json packages/freezedts-cli/package.json
git commit -m "chore: set up npm workspaces with two packages"
```

---

### Task 2: Set up TypeScript configs

**Files:**
- Create: `tsconfig.base.json`
- Create: `packages/freezedts/tsconfig.json`
- Create: `packages/freezedts-cli/tsconfig.json`
- Modify: `tsconfig.test.json`
- Delete: `tsconfig.json`

- [ ] **Step 1: Create `tsconfig.base.json`**

This replaces the current root `tsconfig.json`. Shared compiler options only — no `rootDir`, `outDir`, `include`, or `exclude`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "types": ["bun", "node"]
  }
}
```

- [ ] **Step 2: Create `packages/freezedts/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["src/**/*.test.ts"]
}
```

- [ ] **Step 3: Create `packages/freezedts-cli/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["src/**/*.test.ts"]
}
```

- [ ] **Step 4: Update `tsconfig.test.json`**

Change it to:

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "types": ["bun", "node"],
    "noEmit": true,
    "rootDir": "."
  },
  "include": ["packages/*/src/**/*.ts", "tests/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 5: Delete `tsconfig.json`**

```bash
git rm tsconfig.json
```

- [ ] **Step 6: Commit**

```bash
git add tsconfig.base.json packages/freezedts/tsconfig.json packages/freezedts-cli/tsconfig.json tsconfig.test.json
git commit -m "chore: split tsconfig into base + per-package configs"
```

---

### Task 3: Move runtime source files

**Files:**
- Create: `packages/freezedts/src/index.ts`
- Create: `packages/freezedts/src/runtime/index.ts`
- Create: `packages/freezedts/src/runtime/freezed.ts`
- Create: `packages/freezedts/src/runtime/copy.ts`
- Create: `packages/freezedts/src/runtime/deepEqual.ts`
- Create: `packages/freezedts/src/runtime/deepFreeze.ts`
- Create: `packages/freezedts/src/runtime/freezed.test.ts`
- Create: `packages/freezedts/src/runtime/copy.test.ts`

- [ ] **Step 1: Move runtime source files**

Copy the runtime files from `src/` to `packages/freezedts/src/`. The files are identical — no content changes needed.

```bash
mkdir -p packages/freezedts/src/runtime
cp src/index.ts packages/freezedts/src/index.ts
cp src/runtime/index.ts packages/freezedts/src/runtime/index.ts
cp src/runtime/freezed.ts packages/freezedts/src/runtime/freezed.ts
cp src/runtime/copy.ts packages/freezedts/src/runtime/copy.ts
cp src/runtime/deepEqual.ts packages/freezedts/src/runtime/deepEqual.ts
cp src/runtime/deepFreeze.ts packages/freezedts/src/runtime/deepFreeze.ts
cp src/runtime/freezed.test.ts packages/freezedts/src/runtime/freezed.test.ts
cp src/runtime/copy.test.ts packages/freezedts/src/runtime/copy.test.ts
```

- [ ] **Step 2: Verify the runtime package builds**

```bash
cd packages/freezedts && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Run unit tests for the runtime package**

```bash
bun test packages/freezedts/src/runtime/
```

Expected: All tests pass (freezed.test.ts and copy.test.ts).

- [ ] **Step 4: Commit**

```bash
git add packages/freezedts/src/
git commit -m "chore: copy runtime source files to packages/freezedts"
```

---

### Task 4: Move CLI and generator source files

**Files:**
- Create: `packages/freezedts-cli/src/cli.ts`
- Create: `packages/freezedts-cli/src/excluded-dirs.ts`
- Create: `packages/freezedts-cli/src/cli.test.ts`
- Create: `packages/freezedts-cli/src/generator/config.ts`
- Create: `packages/freezedts-cli/src/generator/emitter.ts`
- Create: `packages/freezedts-cli/src/generator/generator.ts`
- Create: `packages/freezedts-cli/src/generator/parser.ts`
- Create: `packages/freezedts-cli/src/generator/watcher.ts`
- Create: `packages/freezedts-cli/src/generator/config.test.ts`
- Create: `packages/freezedts-cli/src/generator/emitter.test.ts`
- Create: `packages/freezedts-cli/src/generator/generator.test.ts`
- Create: `packages/freezedts-cli/src/generator/parser.test.ts`
- Create: `packages/freezedts-cli/src/generator/watcher.test.ts`

- [ ] **Step 1: Copy CLI and generator files**

```bash
mkdir -p packages/freezedts-cli/src/generator
cp src/cli.ts packages/freezedts-cli/src/cli.ts
cp src/cli.test.ts packages/freezedts-cli/src/cli.test.ts
cp src/excluded-dirs.ts packages/freezedts-cli/src/excluded-dirs.ts
cp src/generator/config.ts packages/freezedts-cli/src/generator/config.ts
cp src/generator/emitter.ts packages/freezedts-cli/src/generator/emitter.ts
cp src/generator/generator.ts packages/freezedts-cli/src/generator/generator.ts
cp src/generator/parser.ts packages/freezedts-cli/src/generator/parser.ts
cp src/generator/watcher.ts packages/freezedts-cli/src/generator/watcher.ts
cp src/generator/config.test.ts packages/freezedts-cli/src/generator/config.test.ts
cp src/generator/emitter.test.ts packages/freezedts-cli/src/generator/emitter.test.ts
cp src/generator/generator.test.ts packages/freezedts-cli/src/generator/generator.test.ts
cp src/generator/parser.test.ts packages/freezedts-cli/src/generator/parser.test.ts
cp src/generator/watcher.test.ts packages/freezedts-cli/src/generator/watcher.test.ts
```

- [ ] **Step 2: Commit**

```bash
git add packages/freezedts-cli/src/
git commit -m "chore: copy CLI and generator source files to packages/freezedts-cli"
```

---

### Task 5: Migrate config from YAML to JSON

**Files:**
- Modify: `packages/freezedts-cli/src/generator/config.ts`
- Modify: `packages/freezedts-cli/src/generator/config.test.ts`
- Modify: `packages/freezedts-cli/src/cli.ts`
- Modify: `packages/freezedts-cli/src/cli.test.ts`

- [ ] **Step 1: Update `packages/freezedts-cli/src/generator/config.ts`**

Replace the file contents. Drop the `yaml` import, use `JSON.parse`:

```typescript
import * as fs from 'node:fs';

export interface ResolvedConfig {
  format: boolean;
  copyWith: boolean;
  equal: boolean;
  toString: boolean;
}

interface FreezedConfigFile {
  freezed?: {
    options?: {
      format?: boolean;
      copyWith?: boolean;
      equal?: boolean;
      toString?: boolean;
    };
  };
}

export const DEFAULTS: ResolvedConfig = {
  format: false,
  copyWith: true,
  equal: true,
  toString: true,
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
    parsed = JSON.parse(raw) as FreezedConfigFile | null;
  } catch {
    throw new Error(`freezedts: invalid JSON in config file: ${configPath}`);
  }
  const options = parsed?.freezed?.options;

  return {
    format: options?.format ?? DEFAULTS.format,
    copyWith: options?.copyWith ?? DEFAULTS.copyWith,
    equal: options?.equal ?? DEFAULTS.equal,
    toString: options?.toString ?? DEFAULTS.toString,
  };
}

export function resolveClassOptions(
  cls: { copyWith?: boolean; equal?: boolean; toString?: boolean },
  config: ResolvedConfig,
): { copyWith: boolean; equal: boolean; toString: boolean } {
  return {
    copyWith: cls.copyWith ?? config.copyWith,
    equal: cls.equal ?? config.equal,
    // Cannot use ?? because Object.prototype.toString would always be truthy
    toString: Object.hasOwn(cls, 'toString') ? cls.toString! : config.toString,
  };
}
```

- [ ] **Step 2: Update `packages/freezedts-cli/src/generator/config.test.ts`**

Replace YAML test data with JSON equivalents. Replace references to `freezedts.config.yaml` with `freezedts.config.json`. Change the "invalid YAML" test to "invalid JSON":

```typescript
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
      const config = loadConfig(path.join(dir, 'freezedts.config.json'));
      expect(config).toEqual({
        format: false,
        copyWith: true,
        equal: true,
        toString: true,
      });
    });
  });

  it('reads copyWith: false from json config', () => {
    withTempDir((dir) => {
      const configPath = path.join(dir, 'freezedts.config.json');
      fs.writeFileSync(configPath, JSON.stringify({ freezed: { options: { copyWith: false } } }));

      const config = loadConfig(configPath);
      expect(config.copyWith).toBe(false);
      expect(config.equal).toBe(true);
      expect(config.format).toBe(false);
    });
  });

  it('reads equal: false from json config', () => {
    withTempDir((dir) => {
      const configPath = path.join(dir, 'freezedts.config.json');
      fs.writeFileSync(configPath, JSON.stringify({ freezed: { options: { equal: false } } }));

      const config = loadConfig(configPath);
      expect(config.equal).toBe(false);
      expect(config.copyWith).toBe(true);
    });
  });

  it('reads toString: false from json config', () => {
    withTempDir((dir) => {
      const configPath = path.join(dir, 'freezedts.config.json');
      fs.writeFileSync(configPath, JSON.stringify({ freezed: { options: { toString: false } } }));

      const config = loadConfig(configPath);
      expect(config.toString).toBe(false);
      expect(config.copyWith).toBe(true);
      expect(config.equal).toBe(true);
    });
  });

  it('reads format: true from json config', () => {
    withTempDir((dir) => {
      const configPath = path.join(dir, 'freezedts.config.json');
      fs.writeFileSync(configPath, JSON.stringify({ freezed: { options: { format: true } } }));

      const config = loadConfig(configPath);
      expect(config.format).toBe(true);
    });
  });

  it('reads all options together', () => {
    withTempDir((dir) => {
      const configPath = path.join(dir, 'freezedts.config.json');
      fs.writeFileSync(configPath, JSON.stringify({
        freezed: {
          options: {
            format: true,
            copyWith: false,
            equal: false,
            toString: false,
          },
        },
      }));

      const config = loadConfig(configPath);
      expect(config).toEqual({
        format: true,
        copyWith: false,
        equal: false,
        toString: false,
      });
    });
  });

  it('handles empty json object gracefully', () => {
    withTempDir((dir) => {
      const configPath = path.join(dir, 'freezedts.config.json');
      fs.writeFileSync(configPath, '{}');

      const config = loadConfig(configPath);
      expect(config).toEqual({
        format: false,
        copyWith: true,
        equal: true,
        toString: true,
      });
    });
  });

  it('handles json with freezed key but no options', () => {
    withTempDir((dir) => {
      const configPath = path.join(dir, 'freezedts.config.json');
      fs.writeFileSync(configPath, JSON.stringify({ freezed: {} }));

      const config = loadConfig(configPath);
      expect(config).toEqual({
        format: false,
        copyWith: true,
        equal: true,
        toString: true,
      });
    });
  });

  it('throws a clear error for invalid JSON', async () => {
    await withTempDir((dir) => {
      const configPath = path.join(dir, 'freezedts.config.json');
      fs.writeFileSync(configPath, '{{{{invalid json content');

      expect(() => loadConfig(configPath)).toThrow('invalid JSON');
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
```

- [ ] **Step 3: Update config path in `packages/freezedts-cli/src/cli.ts`**

Change line 86 from:
```typescript
  const configPath = args.config ?? path.join(resolvedDir, 'freezedts.config.yaml');
```
to:
```typescript
  const configPath = args.config ?? path.join(resolvedDir, 'freezedts.config.json');
```

- [ ] **Step 4: Update `packages/freezedts-cli/src/cli.test.ts`**

In the `parseArgs` tests, update the test data that references `.yaml` config paths. Change:
- `'custom.yaml'` → `'custom.json'`
- `'my.yaml'` → `'my.json'`
- `'cfg.yaml'` → `'cfg.json'`

And update expected values accordingly. Specifically, replace:

```typescript
  it('parses --config flag with path', () => {
    expect(parseArgs(['node', 'cli.js', '--config', 'custom.yaml'])).toEqual({
      watch: false,
      dir: '.',
      config: 'custom.yaml',
    });
  });

  it('parses -c shorthand for config', () => {
    expect(parseArgs(['node', 'cli.js', '-c', 'my.yaml'])).toEqual({
      watch: false,
      dir: '.',
      config: 'my.yaml',
    });
  });

  it('parses --config with --watch and directory', () => {
    expect(parseArgs(['node', 'cli.js', '--watch', '--config', 'cfg.yaml', 'src'])).toEqual({
      watch: true,
      dir: 'src',
      config: 'cfg.yaml',
    });
  });
```

with:

```typescript
  it('parses --config flag with path', () => {
    expect(parseArgs(['node', 'cli.js', '--config', 'custom.json'])).toEqual({
      watch: false,
      dir: '.',
      config: 'custom.json',
    });
  });

  it('parses -c shorthand for config', () => {
    expect(parseArgs(['node', 'cli.js', '-c', 'my.json'])).toEqual({
      watch: false,
      dir: '.',
      config: 'my.json',
    });
  });

  it('parses --config with --watch and directory', () => {
    expect(parseArgs(['node', 'cli.js', '--watch', '--config', 'cfg.json', 'src'])).toEqual({
      watch: true,
      dir: 'src',
      config: 'cfg.json',
    });
  });
```

- [ ] **Step 5: Run config and CLI unit tests**

```bash
bun test packages/freezedts-cli/src/generator/config.test.ts packages/freezedts-cli/src/cli.test.ts
```

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/freezedts-cli/src/generator/config.ts packages/freezedts-cli/src/generator/config.test.ts packages/freezedts-cli/src/cli.ts packages/freezedts-cli/src/cli.test.ts
git commit -m "feat: migrate config from YAML to JSON"
```

---

### Task 6: Install workspace dependencies and verify builds

**Files:**
- None created/modified — dependency resolution and build verification

- [ ] **Step 1: Install workspace dependencies**

```bash
npm install
```

This creates workspace symlinks so `freezedts-cli` can resolve `freezedts` locally.

- [ ] **Step 2: Build both packages**

```bash
npm run build --workspaces
```

Expected: Both packages compile without errors, producing `packages/freezedts/dist/` and `packages/freezedts-cli/dist/`.

- [ ] **Step 3: Run all unit tests in packages**

```bash
bun test packages/
```

Expected: All unit tests pass (runtime + CLI + generator tests).

- [ ] **Step 4: Commit lock file changes if any**

```bash
git add package-lock.json
git commit -m "chore: update lock file for workspace dependencies"
```

---

### Task 7: Update integration test import paths

**Files:**
- Modify: all `tests/*/*.test.ts` files (14 files)

All integration tests import `generate` from `'../../src/generator/generator.js'`. This path changes to `'../../packages/freezedts-cli/src/generator/generator.js'`.

- [ ] **Step 1: Update import paths in all integration tests**

In every test file under `tests/`, change:
```typescript
import { generate } from '../../src/generator/generator.js';
```
to:
```typescript
import { generate } from '../../packages/freezedts-cli/src/generator/generator.js';
```

The full list of files to update:
- `tests/immutability/immutability.test.ts`
- `tests/shallow-copy/shallow-copy.test.ts`
- `tests/deep-copy/deep-copy.test.ts`
- `tests/equality/equality.test.ts`
- `tests/equality/map-set-equality.test.ts`
- `tests/equality/nan-equality.test.ts`
- `tests/equality/nullable-freezed.test.ts`
- `tests/collections/collections.test.ts`
- `tests/toString/toString.test.ts`
- `tests/field-config/field-config.test.ts`
- `tests/config/config.test.ts`
- `tests/cross-file/cross-file.test.ts`
- `tests/interface-params/interface-params.test.ts`
- `tests/transitive-dependencies/transitive-dependencies.test.ts`

- [ ] **Step 2: Run all tests**

```bash
bun test
```

Expected: All tests pass — both unit tests in `packages/` and integration tests in `tests/`.

- [ ] **Step 3: Commit**

```bash
git add tests/
git commit -m "chore: update integration test import paths for workspace layout"
```

---

### Task 8: Delete old src/ directory and tsconfig.json

**Files:**
- Delete: `src/` (entire directory)
- Delete: `tsconfig.json` (if not already deleted in Task 2)

- [ ] **Step 1: Remove the old src/ directory**

```bash
git rm -r src/
```

- [ ] **Step 2: Run all tests to verify nothing depends on old paths**

```bash
bun test
```

Expected: All tests pass.

- [ ] **Step 3: Build to verify**

```bash
npm run build --workspaces
```

Expected: Both packages build cleanly.

- [ ] **Step 4: Commit**

```bash
git commit -m "chore: remove old src/ directory after migration to packages/"
```

---

### Task 9: Update CI workflow

**Files:**
- Modify: `.github/workflows/node.js.yml`

- [ ] **Step 1: Update `.github/workflows/node.js.yml`**

The current CI does `npm run build --if-present`. With workspaces, `npm run build` in the root already runs `npm run build --workspaces`. Update the workflow to also run `npm install` (which sets up workspace symlinks):

Replace the steps section:

```yaml
    steps:
    - uses: actions/checkout@v4
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    - name: Setup Bun
      uses: oven-sh/setup-bun@v2
      with:
        bun-version: latest
    - run: npm install
    - run: npm run build
    - run: npm test
```

Key change: `bun add -d @types/bun` is no longer needed (it's in root devDependencies), and `npm run build --if-present` becomes `npm run build` (the script is always present).

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/node.js.yml
git commit -m "ci: update workflow for npm workspaces"
```

---

### Task 10: Update README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update Installation section**

Replace:
```markdown
## Installation

```bash
npm install freezedts
```

`freezedts` must be a runtime dependency. It has a small runtime footprint and
no transient runtime dependencies.
```

With:
```markdown
## Installation

```bash
npm install freezedts
npm install -D freezedts-cli
```

`freezedts` is the runtime — add it as a production dependency. It has zero transitive dependencies.

`freezedts-cli` is the code generator — add it as a dev dependency. It depends on `ts-morph` for AST parsing.
```

- [ ] **Step 2: Update Running the Generator section**

Replace the config flag examples that reference `.yaml`:

```markdown
# Use a custom config file
npx freezedts --config path/to/freezedts.config.json
npx freezedts -c custom.json -w src
```

- [ ] **Step 3: Update Project-Wide Configuration section**

Replace:
```markdown
### Project-Wide Configuration

Create a `freezedts.config.yaml` in your project root:

```yaml
freezed:
  options:
    # Format generated .freezed.ts files (can slow down generation)
    format: true

    # Disable with() generation for the entire project
    copyWith: false

    # Disable equals() generation for the entire project
    equal: false

    # Disable toString() generation for the entire project
    toString: false
```
```

With:
```markdown
### Project-Wide Configuration

Create a `freezedts.config.json` in your project root:

```json
{
  "freezed": {
    "options": {
      "format": true,
      "copyWith": false,
      "equal": false,
      "toString": false
    }
  }
}
```
```

- [ ] **Step 4: Update Resolution Order section**

Replace references to `freezedts.config.yaml` with `freezedts.config.json`:

```markdown
### Resolution Order

Per-class `@freezed()` options override project-wide `freezedts.config.json` defaults. If neither specifies a value, the built-in default applies (all features enabled).

```
per-class @freezed()  →  freezedts.config.json  →  built-in defaults
    (highest priority)                              (lowest priority)
```
```

- [ ] **Step 5: Update Building the Library section**

Replace:
```markdown
## Building the Library

```bash
# Install dependencies
npm install

# Build TypeScript to dist/
npm run build

# Run tests
npm test

# Run the generator on this project's source files
npm run generate

# Watch mode for tests
npm run test:watch
```

The project uses:
- **TypeScript 6** with ES2022 target and Node16 module resolution
- **bun:test** for testing
- **ts-morph** for AST parsing and code generation
```

With:
```markdown
## Building the Library

```bash
# Install dependencies (sets up workspace symlinks)
npm install

# Build both packages
npm run build

# Run tests
npm test

# Run the generator on this project's source files
npm run generate

# Watch mode for tests
npm run test:watch
```

The project is structured as an npm workspace with two packages:
- **freezedts** — runtime library (zero dependencies)
- **freezedts-cli** — code generator (depends on ts-morph)

Other tools:
- **TypeScript 6** with ES2022 target and Node16 module resolution
- **bun:test** for testing
```

- [ ] **Step 6: Commit**

```bash
git add README.md
git commit -m "docs: update README for two-package workspace layout"
```

---

### Task 11: Final verification

- [ ] **Step 1: Clean build from scratch**

```bash
rm -rf packages/freezedts/dist packages/freezedts-cli/dist node_modules
npm install
npm run build
```

Expected: Both packages build successfully.

- [ ] **Step 2: Run full test suite**

```bash
bun test
```

Expected: All unit and integration tests pass.

- [ ] **Step 3: Verify the CLI works end-to-end**

```bash
npm run generate
```

Expected: Generator runs and reports files scanned/generated.

- [ ] **Step 4: Verify package contents**

```bash
cd packages/freezedts && npm pack --dry-run
cd packages/freezedts-cli && npm pack --dry-run
```

Expected: Each package lists only `dist/` files (no test files, no source).
