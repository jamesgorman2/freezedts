# Modern TypeScript (5.0+)

## Table of Contents

- [Stage 3 Decorators (TS 5.0+)](#stage-3-decorators)
- [using Declarations (TS 5.2+)](#using-declarations)
- [Import Attributes (TS 5.3+)](#import-attributes)
- [Const Type Parameters (TS 5.0+)](#const-type-parameters)
- [Inferred Type Predicates (TS 5.5+)](#inferred-type-predicates)
- [isolatedDeclarations (TS 5.5+)](#isolateddeclarations)
- [Regular Expression Checking (TS 5.5+)](#regular-expression-checking)
- [TS 5.6 Features](#ts-56-features)
- [TS 5.7 Features](#ts-57-features)
- [TS 5.8 Features](#ts-58-features)

---

## Stage 3 Decorators

TypeScript 5.0 aligned with the ECMAScript Stage 3 Decorator proposal. New
projects should use standard decorators -- do not enable `experimentalDecorators`.

```ts
// Simple decorator -- does not wrap the function
function log(
  target: (...args: any[]) => any,
  context: ClassMethodDecoratorContext
): void {
  context.addInitializer(function () {
    console.log(`Initialized method: ${String(context.name)}`);
  });
}

// Decorator that wraps the function with correct `this` typing
function logged<This, Args extends any[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
): (this: This, ...args: Args) => Return {
  return function (this: This, ...args: Args): Return {
    console.log(`Calling ${String(context.name)} with`, args);
    return target.call(this, ...args);
  };
}
```

**Key differences from legacy decorators:**
- Receive a `context` object instead of prototype/descriptor
- No parameter decoration (affects DI frameworks)
- No automatic metadata emission
- Better type safety through the context-based API
- `addInitializer` method for running logic at class instantiation

**Guidance:** Only use decorators when your framework requires them (NestJS,
TypeORM). For application code, prefer explicit function composition.

**NestJS exception:** As of early 2026, NestJS still relies on legacy decorators
and `reflect-metadata`. Projects using NestJS must enable
`experimentalDecorators` and `emitDecoratorMetadata`.

---

## using Declarations

The `using` keyword (TS 5.2+) creates bindings that are automatically disposed
when the scope exits, similar to C#'s `using` or Python's `with`.

**Library requirement:** Requires `"lib": ["esnext.disposable"]` (or `"ES2025"`
or `"ESNext"`).

```ts
class DatabaseConnection implements Disposable {
  constructor(private url: string) {
    console.log("Connected to", url);
  }

  query(sql: string): unknown[] { return []; }

  [Symbol.dispose](): void {
    console.log("Connection closed");
  }
}

function fetchUsers() {
  using conn = new DatabaseConnection("postgres://localhost/mydb");
  return conn.query("SELECT * FROM users");
  // conn[Symbol.dispose]() called here, even if query throws
}

// Async version
async function processData() {
  await using conn = new AsyncDatabaseConnection("postgres://localhost/mydb");
  return conn.query("SELECT * FROM orders");
  // conn[Symbol.asyncDispose]() awaited when scope exits
}

class AsyncDatabaseConnection implements AsyncDisposable {
  constructor(private url: string) {}
  async query(sql: string): Promise<unknown[]> { return []; }
  async [Symbol.asyncDispose](): Promise<void> {
    console.log("Async connection closed");
  }
}
```

**`DisposableStack`** groups multiple resources:

```ts
function runWithServices() {
  using stack = new DisposableStack();
  const db = stack.use(new DatabaseConnection(url));
  const cache = stack.use(new CacheClient(redisUrl));
  // All disposed in reverse order when scope exits
}
```

**Test cleanup pattern:**

```ts
function createTestServer(): Disposable & { url: string } {
  const server = startServer({ port: 0 });
  return {
    url: `http://localhost:${server.port}`,
    [Symbol.dispose]() { server.close(); },
  };
}

test("fetches users", async () => {
  using server = createTestServer();
  const response = await fetch(`${server.url}/users`);
  // server automatically closed when test exits
});
```

---

## Import Attributes

Import attributes (TS 5.3+) use the `with` keyword to provide metadata about
imports:

```ts
import config from "./config.json" with { type: "json" };
import styles from "./component.css" with { type: "css" };

// Dynamic import
const data = await import("./data.json", { with: { type: "json" } });
```

The keyword changed from `assert` to `with` when the proposal was renamed.

**Runtime requirements:** Node.js supports `with { type: "json" }` from v21+.
Not all bundlers handle all attribute types -- check your bundler's documentation.

---

## Const Type Parameters

Adding `const` to a type parameter (TS 5.0+) triggers `as const`-like inference
for arguments:

```ts
// Without const: values widened
function createRoute<T extends readonly string[]>(paths: T) {
  return paths;
}
createRoute(["home", "about"]); // ^? string[]

// With const: literal types preserved
function createRoute<const T extends readonly string[]>(paths: T) {
  return paths;
}
createRoute(["home", "about"]); // ^? readonly ["home", "about"]
```

Eliminates the need for callers to write `as const` at call sites.

---

## Inferred Type Predicates

TypeScript 5.5 can automatically infer type predicates for filter callbacks:

```ts
const values: (string | null)[] = ["a", null, "b", null];

// Before TS 5.5: (string | null)[]
// After TS 5.5: string[]
const strings = values.filter((v) => v !== null);
```

TypeScript infers that `(v) => v !== null` has the predicate `v is string`,
making `.filter()` return the narrowed type.

---

## isolatedDeclarations

This option (TS 5.5+) requires explicit type annotations on all exports,
enabling external tools to generate `.d.ts` files without running the full
type checker:

```jsonc
{
  "compilerOptions": {
    "declaration": true,
    "isolatedDeclarations": true
  }
}
```

```ts
// Error: must annotate return type
export function add(a: number, b: number) { return a + b; }

// Fixed
export function add(a: number, b: number): number { return a + b; }
```

Primarily useful for libraries wanting faster declaration generation and
monorepos where declarations are generated in parallel.

---

## Regular Expression Checking

TypeScript 5.5 validates regex syntax at compile time:

```ts
const pattern = /(?<=\d+)\.\d+/;  // OK: valid lookbehind
const broken = /(?<=\d+\.\d+/;    // Error: unterminated group
```

---

## TS 5.6 Features

**Always-truthy / always-falsy checks:** TS 5.6 detects conditions that are
always true or always false:

```ts
function process(items: string[]) {
  if (items.filter) { /* ... */ }
  // Error: condition always true -- function is always defined

  if (items.filter(Boolean).length > 0) { /* ... */ }
  // Correct: call the function
}
```

---

## TS 5.7 Features

**Uninitialized variable checks:** Reports errors when variables are used before
being assigned in all code paths:

```ts
let value: string;
if (condition) { value = "hello"; }
console.log(value); // Error: used before assigned
```

**`--target es2024` and `--lib es2024`:** Includes `Object.groupBy`,
`Map.groupBy`, `Promise.withResolvers`, and `Atomics.waitAsync`.

**Path rewriting for relative imports:** The `--rewriteRelativeImportExtensions`
flag rewrites `.ts` extensions to `.js` in output, reducing friction for ESM
projects that want to use `.ts` extensions in source:

```jsonc
{
  "compilerOptions": {
    "rewriteRelativeImportExtensions": true
  }
}
```

```ts
// Source: import uses .ts extension
import { helper } from "./utils.ts";

// Output: rewritten to .js
import { helper } from "./utils.js";
```

---

## TS 5.8 Features

**`erasableSyntaxOnly`:** Prohibits TypeScript syntax that generates runtime
code (`enum`, `namespace`, parameter properties). Designed for Node.js native
type stripping (Node.js 22.6+). See [configuration.md](configuration.md).

**Granular `@ts-expect-error`:** Specify which error code to suppress:

```ts
// @ts-expect-error(2322) -- intentional type mismatch for legacy API
const value: string = 42;
```

See [patterns.md](patterns.md) for more on `@ts-expect-error` usage.

**Improved return-type narrowing:** Better narrowing of return types based on
conditional expressions, reducing the need for explicit annotations in complex
branching logic.

**`--module nodenext` updates:** Better alignment with latest Node.js module
resolution behavior and `package.json` `"exports"` conditions.
