# Performance

## Table of Contents

- [Avoiding Excessive Type Complexity](#avoiding-excessive-type-complexity)
- [Project References for Monorepos](#project-references-for-monorepos)
- [Incremental Compilation](#incremental-compilation)
- [skipLibCheck](#skiplibcheck)
- [TypeScript Native (tsgo)](#typescript-native-tsgo)

---

## Avoiding Excessive Type Complexity

Complex generics with conditional types and mapped types increase CPU load
during compilation. When types depend on other types that include conditionals
and recursion, type-checking complexity grows combinatorially (and can grow
exponentially in pathological recursive cases).

**Strategies:**

### 1. Annotate return types on exported functions

Named types are more compact than anonymous types inferred by the compiler.
This is especially important for module boundaries. For internal helpers,
inference is fine.

```ts
// BAD: Compiler must infer complex return type every time
export function buildConfig(env: Env) {
  return { /* complex object */ };
}

// GOOD: Named return type -- compiler skips inference
export function buildConfig(env: Env): AppConfig {
  return { /* complex object */ };
}
```

Enforce with `typescript-eslint`'s `explicit-module-boundary-types` rule.
See [type-system.md](type-system.md) for full return type annotation guidance.

### 2. Cache intermediate types

```ts
// BAD: Recomputed on every use
type Result = Transform<Filter<Source, Predicate>>;
type Other = Extend<Transform<Filter<Source, Predicate>>>;

// GOOD: Cached intermediate
type Filtered = Filter<Source, Predicate>;
type Transformed = Transform<Filtered>;
type Other = Extend<Transformed>;
```

### 3. Limit recursion depth in recursive types

Deeply recursive types can cause the compiler to hang. Set explicit depth
limits or restructure to avoid unbounded recursion.

### 4. Avoid unions larger than ~100 members

Large unions slow down assignability checks. If you have a massive union,
consider restructuring (e.g., using a Map or Record at the value level).

### 5. Avoid excessive overloads

Prefer a single generic signature with conditional return types over 10+
overloads. See [patterns.md](patterns.md) for the overloads vs conditional
return types pattern.

---

## Project References for Monorepos

Project references split a large codebase into smaller compilation units that
can be built independently and incrementally:

```jsonc
// tsconfig.json (root)
{
  "references": [
    { "path": "./packages/shared" },
    { "path": "./packages/server" },
    { "path": "./packages/client" }
  ],
  "files": []  // Root config doesn't compile anything
}

// packages/shared/tsconfig.json
{
  "compilerOptions": {
    "composite": true,    // Required for project references
    "declaration": true,
    "declarationMap": true,
    "outDir": "dist"
  }
}
```

Build with `tsc --build` (or `tsc -b`) which only recompiles changed projects.

Project references can reduce build times by 5-10x in large monorepos by
skipping unchanged projects entirely.

---

## Incremental Compilation

```jsonc
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": "./.tsbuildinfo"
  }
}
```

Incremental compilation saves previous compilation state and only rechecks
changed files. Combine with `composite: true` for project references.

---

## skipLibCheck

```jsonc
{
  "compilerOptions": {
    "skipLibCheck": true
  }
}
```

Skips type-checking `.d.ts` files from `node_modules`. Significantly reduces
compilation time and avoids false positives from conflicting type definitions
between dependencies. Use in most projects.

**Exception:** Library authors who emit `.d.ts` files may want to disable this
to catch conflicts between their own declarations and dependencies' types.

---

## TypeScript Native (tsgo)

TypeScript 7 -- officially called TypeScript Native (CLI tool: `tsgo`) -- was
announced March 2025 and is still in preview/beta as of early 2026. It is a
port of the compiler to Go.

The official "Progress on TypeScript 7 -- December 2025" blog post reports
approximately 10x faster full-project type-checking on the TypeScript compiler's
own codebase, with similar improvements in other large projects. The
reimplemented `--incremental` mode shows even larger gains for subsequent builds.

**Important:** TS 7 is not yet production-ready. Teams should not plan
production migrations until a stable release is published. Track progress at
the [TypeScript blog](https://devblogs.microsoft.com/typescript/).
