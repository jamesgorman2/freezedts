# Two-Package Split Design

Split `freezedts` into two npm packages: a zero-dependency runtime and a CLI/generator package.

## Packages

### `freezedts` (runtime) — v0.13.0

The user-facing runtime package. Zero dependencies.

**Exports:**
- `"."` → `dist/index.js` — user-facing API: `freezed` decorator, `FreezedOptions` type
- `"./runtime"` → `dist/runtime/index.js` — generated-code internals: `createWithProxy`, `deepEqual`, `deepFreeze`, `isFreezedInstance`, `getFreezedOptions`, `FREEZED_OPTIONS`

**Source files:**
- `packages/freezedts/src/index.ts`
- `packages/freezedts/src/runtime/index.ts`
- `packages/freezedts/src/runtime/freezed.ts`
- `packages/freezedts/src/runtime/copy.ts`
- `packages/freezedts/src/runtime/deepEqual.ts`
- `packages/freezedts/src/runtime/deepFreeze.ts`

### `freezedts-cli` (CLI/generator) — v0.13.0

The code generator. Installed as a devDependency.

**Dependencies:** `freezedts` (runtime), `ts-morph`

**Binary:** `freezedts` (via `bin` field)

**Source files:**
- `packages/freezedts-cli/src/cli.ts`
- `packages/freezedts-cli/src/excluded-dirs.ts`
- `packages/freezedts-cli/src/generator/config.ts`
- `packages/freezedts-cli/src/generator/emitter.ts`
- `packages/freezedts-cli/src/generator/generator.ts`
- `packages/freezedts-cli/src/generator/parser.ts`

## Repository Structure

```
freezedts/
├── package.json              (workspace root — private, not published)
├── tsconfig.base.json        (shared compiler options)
├── tsconfig.test.json        (test type-checking config)
├── packages/
│   ├── freezedts/
│   │   ├── package.json
│   │   ├── tsconfig.json     (extends ../../tsconfig.base.json)
│   │   └── src/
│   │       ├── index.ts
│   │       └── runtime/
│   │           ├── index.ts
│   │           ├── freezed.ts
│   │           ├── copy.ts
│   │           ├── deepEqual.ts
│   │           └── deepFreeze.ts
│   └── freezedts-cli/
│       ├── package.json
│       ├── tsconfig.json     (extends ../../tsconfig.base.json)
│       └── src/
│           ├── cli.ts
│           ├── excluded-dirs.ts
│           └── generator/
│               ├── config.ts
│               ├── emitter.ts
│               ├── generator.ts
│               └── parser.ts
├── tests/                    (integration tests — stay at root)
├── docs/
├── README.md
└── CLAUDE.md
```

## Package Definitions

### Root `package.json`

```json
{
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "build": "npm run build --workspaces",
    "test": "bun test",
    "generate": "bun packages/freezedts-cli/src/cli.ts"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "@types/node": "^25.5.2",
    "typescript": "^6.0.2"
  }
}
```

### `packages/freezedts/package.json`

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

### `packages/freezedts-cli/package.json`

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

## TypeScript Configuration

### `tsconfig.base.json` (root)

Renamed from current `tsconfig.json`. Contains shared `compilerOptions` only:

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

### Per-package `tsconfig.json`

Each package extends the base and defines its own `rootDir`, `outDir`, `include`, `exclude`:

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

### `tsconfig.test.json` (root)

Updated to reference both packages:

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true,
    "rootDir": "."
  },
  "include": ["packages/*/src/**/*.ts", "tests/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

## Config Migration: YAML to JSON

`config.ts` drops the `yaml` dependency.

- Default config file: `freezedts.config.json` (was `freezedts.config.yaml`)
- CLI flag: `--config`/`-c` still works, now expects a JSON file
- `loadConfig` uses `JSON.parse(fs.readFileSync(...))` instead of `parseYaml`
- Same structure:

```json
{
  "freezed": {
    "options": {
      "format": false,
      "copyWith": true,
      "equal": true,
      "toString": true
    }
  }
}
```

## Test Updates

Integration tests stay at `tests/` in the root.

**Import path changes in integration tests:**
- `from '../../src/generator/generator.js'` → `from '../../packages/freezedts-cli/src/generator/generator.js'`

**Unit tests move with their source:**
- `src/runtime/*.test.ts` → `packages/freezedts/src/runtime/`
- `src/generator/*.test.ts` → `packages/freezedts-cli/src/generator/`
- `src/cli.test.ts` → `packages/freezedts-cli/src/`

## README Updates

- **Installation:** `npm install freezedts` + `npm install -D freezedts-cli`
- **Config section:** `freezedts.config.json` replaces `freezedts.config.yaml`, with JSON examples
- **CLI config flag examples:** updated to reference `.json`
- **Building section:** updated for workspace commands
- **Tech stack note:** remove `yaml` mention, note the two-package structure
