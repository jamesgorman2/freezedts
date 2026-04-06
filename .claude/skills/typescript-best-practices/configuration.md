# Configuration

## Table of Contents

- [Bundler Projects (Vite, webpack, esbuild)](#bundler-projects)
- [Node.js Libraries](#nodejs-libraries)
- [Key Options Explained](#key-options-explained)
- [Path Aliases](#path-aliases)
- [Linting with typescript-eslint](#linting-with-typescript-eslint)

---

## Bundler Projects

For projects using Vite, webpack, esbuild, or similar bundlers:

```jsonc
{
  "compilerOptions": {
    // Language and output
    "target": "ES2022",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],

    // Module system
    "module": "ESNext",
    "moduleResolution": "bundler",
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "resolveJsonModule": true,

    // Type checking -- maximum strictness
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "noPropertyAccessFromIndexSignature": true,

    // Emit
    "noEmit": true,
    "skipLibCheck": true,

    // Path aliases (no baseUrl needed in TS 5.x)
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["node_modules"]
}
```

**Notes:**
- `paths` no longer requires `baseUrl` in TS 5.x. Avoid setting `baseUrl`
  unless specifically needed -- it can cause bare specifiers to resolve to local
  files instead of `node_modules` packages.
- `resolveJsonModule` defaults to `true` with `"moduleResolution": "bundler"`.
  Included for clarity.
- React projects should add `"jsx": "react-jsx"`.
- `target` controls emitted syntax; `lib` controls available type definitions.
  `lib` can be newer than `target` when the runtime or bundler polyfills support
  those APIs. Use `ES2022` as a safe floor; TS 5.7 added `es2024` support.
- `module: "preserve"` (TS 5.4+) is an alternative to `"ESNext"` that more
  explicitly communicates the bundler manages module format.

---

## Node.js Libraries

For Node.js packages that emit their own JavaScript:

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],

    "module": "NodeNext",
    "moduleResolution": "nodenext",
    "verbatimModuleSyntax": true,
    "isolatedModules": true,

    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "noPropertyAccessFromIndexSignature": true,

    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

---

## Key Options Explained

### moduleResolution: "bundler"

Supports `package.json` `"exports"` and `"imports"` fields (like `nodenext`)
while allowing extensionless imports (unlike `nodenext`). Use for any project
that goes through a bundler.

### verbatimModuleSyntax: true

Ensures import/export statements are preserved exactly as written:
- Imports with the `type` modifier are always erased
- Imports without `type` are always preserved

This eliminates ambiguity around import elision:

```ts
import type { User } from "./types";     // Erased from output
import { createUser } from "./service";  // Preserved in output
```

### isolatedModules: true

Ensures every file can be independently transpiled. Required for esbuild, SWC,
and Babel. Disallows `const enum` across files and namespace merging.

### erasableSyntaxOnly (TS 5.8+)

Prohibits TypeScript syntax that generates runtime code: `enum`, `namespace`,
parameter properties, and `import x = require(...)`. Designed for Node.js
native type stripping:

```jsonc
{
  "compilerOptions": {
    "erasableSyntaxOnly": true,
    "verbatimModuleSyntax": true
  }
}
```

Use for new projects that want maximum alignment with the JavaScript
type-stripping future. See [modern-features.md](modern-features.md) for full
TS 5.8 feature context.

---

## Path Aliases

Path aliases eliminate deep relative imports:

```jsonc
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@server/*": ["./src/server/*"]
    }
  }
}
```

**Avoid `baseUrl`** unless you specifically need bare specifier resolution.
Setting `baseUrl` can cause `import "utils"` to resolve to `./utils` instead
of the `node_modules/utils` package.

Configure your bundler or test runner to resolve these aliases too. For Vite
projects, the `vite-tsconfig-paths` plugin auto-reads paths from `tsconfig.json`.

---

## Linting with typescript-eslint

Use `@typescript-eslint/eslint-plugin` with the `recommendedTypeChecked`
ruleset. For new projects, `strictTypeChecked` is the more aggressive preset.

```js
// eslint.config.js (flat config)
import tseslint from "typescript-eslint";

export default tseslint.config(
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        // projectService replaces deprecated `project` option
        // **Requires typescript-eslint v8+** -- v6/v7 do not support this option
        projectService: true,
      },
    },
  },
);
```

Key rules for async code:
- `no-floating-promises` -- catches promises neither awaited nor caught
- `no-misused-promises` -- catches async functions where sync callbacks expected
- `require-await` -- flags `async` functions that do not use `await`

Other important rules:
- `explicit-module-boundary-types` -- requires return type annotations on exports
- `no-unnecessary-type-parameters` -- flags generics used only once in a signature
