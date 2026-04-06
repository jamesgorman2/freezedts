# Patterns and Anti-Patterns

## Table of Contents

- [unknown vs any](#unknown-vs-any)
- [ts-expect-error over ts-ignore](#ts-expect-error-over-ts-ignore)
- [Anti-Patterns to Avoid](#anti-patterns-to-avoid)
- [Recommended Patterns](#recommended-patterns)

---

## unknown vs any

`any` disables the type system. It is contagious -- anything that touches `any`
becomes `any`. Use `unknown` as the type-safe alternative:

```ts
// BAD: any spreads silently
function parse(input: any) {
  return input.foo.bar.baz; // No error, will crash at runtime
}

// GOOD: unknown forces you to narrow first
function parse(input: unknown) {
  if (
    typeof input === "object" &&
    input !== null &&
    "foo" in input
  ) {
    // TypeScript knows input has a foo property
  }
}
```

**The only acceptable uses of `any`:**
- Type assertion escape hatches in tests (sparingly)
- Third-party library type workarounds (with a `// TODO` comment)
- Generic constraint positions where `unknown` does not work

**Prefer `unknown` for:**
- Catch blocks (default with `useUnknownInCatchVariables`)
- JSON parsing results
- External data boundaries (API responses, user input)
- Function parameters that accept "anything"

---

## ts-expect-error over ts-ignore

Always prefer `@ts-expect-error` over `@ts-ignore`. Both suppress errors on the
next line, but `@ts-expect-error` produces an error when the suppression is no
longer needed, making it self-cleaning:

```ts
// BAD: Silently suppresses errors forever
// @ts-ignore
const result = legacyApi.doSomething();

// GOOD: Errors when suppression is no longer needed
// @ts-expect-error -- legacyApi types missing doSomething until v3
const result = legacyApi.doSomething();
```

Reserve `@ts-ignore` for the rare case where a line may or may not produce an
error depending on TypeScript version or platform.

**Granular suppression (TS 5.8+):** Specify which error code to suppress:

```ts
// Suppress only TS2322 -- any other error still reported
// @ts-expect-error(2322) -- intentional type mismatch for legacy API
const value: string = 42;
```

---

## Anti-Patterns to Avoid

### Over-engineering types

```ts
// BAD: Type puzzle, not production code
type DeepPartialReadonlyMappedConditionalNested<T> =
  T extends object
    ? { readonly [K in keyof T]?: DeepPartialReadonlyMappedConditionalNested<T[K]> }
    : T;

// GOOD: Simplest type that works
type Config = Partial<BaseConfig>;
```

**Rule:** If a colleague cannot understand a type in 30 seconds, simplify it.

### Unnecessary type parameters

A type parameter should appear at least twice in a function signature. If used
only once, it can be replaced with the concrete type:

```ts
// BAD: T used only once
function getLength<T extends string>(value: T): number {
  return value.length;
}

// GOOD: Just use the concrete type
function getLength(value: string): number {
  return value.length;
}

// BAD: T only in return position -- essentially an unsafe cast
function parse<T>(json: string): T {
  return JSON.parse(json);
}

// GOOD: Use a schema/validator to control the type
function parse<T>(json: string, schema: z.ZodType<T>): T {
  return schema.parse(JSON.parse(json));
}
```

Enforce with `typescript-eslint`'s `no-unnecessary-type-parameters` rule.

### Premature type abstraction

```ts
// BAD: Multi-parameter generic used in exactly one place
type Wrapper<T, M extends Record<string, unknown>, C extends string> = {
  data: T;
  meta: M;
  channel: C;
};
type UserEvent = Wrapper<User, { source: string }, "websocket">;

// GOOD: Inline until repeated in 3+ places
type UserEvent = {
  data: User;
  meta: { source: string };
  channel: "websocket";
};
```

Simple single-parameter wrappers like `ApiResponse<T>` can be appropriate
earlier when building libraries or shared API clients.

### Using `as` instead of runtime validation

```ts
// BAD: Type assertions bypass safety
const user = response.data as User;

// GOOD: Validate at runtime, let TypeScript narrow
function isUser(data: unknown): data is User {
  return (
    typeof data === "object" &&
    data !== null &&
    "id" in data &&
    "name" in data
  );
}

if (isUser(response.data)) {
  response.data.name; // safely narrowed
}
```

### Deep interface extension chains

Prefer shallow `interface extends` hierarchies (2-3 levels). When a hierarchy
must go deeper, flatten the type rather than switching to intersections:

```ts
// GOOD: Shallow, clear
interface A { a: string }
interface B extends A { b: string }
interface C extends B { c: string }

// BAD: 5+ levels deep
interface E extends D { e: string } // D extends C extends B extends A

// BAD: Switching to intersections to avoid depth
type E = A & B & C & D & { e: string };

// GOOD: Flatten into a single interface
interface E extends A {
  b: string;
  c: string;
  d: string;
  e: string;
}

// GOOD: Composition over deep inheritance
interface Identifiable { id: string }
interface Timestamped { createdAt: Date; updatedAt: Date }
interface Entity extends Identifiable, Timestamped { name: string }
```

### Overusing enum

```ts
// BAD: Numeric enums -- reverse-mapping quirks, runtime overhead
enum Direction { Up, Down, Left, Right }

// ACCEPTABLE: String enums in existing codebases
enum Status { Active = "ACTIVE", Inactive = "INACTIVE" }

// GOOD: Union type -- zero runtime cost
type Status = "ACTIVE" | "INACTIVE";

// GOOD: as const object -- runtime values with exhaustive type support
const Status = {
  Active: "ACTIVE",
  Inactive: "INACTIVE",
} as const;
type Status = (typeof Status)[keyof typeof Status];
```

Avoid numeric enums. String enums are tolerable in existing codebases but const
objects or union types are preferred for new code. Exception: numeric enums
are appropriate when matching C-style enums from native APIs or protobuf
definitions.

**This guidance is about TypeScript's `enum` keyword.** GraphQL schema enums
are a separate concept with their own conventions -- see
**graphql-best-practices** for those.

---

## Recommended Patterns

### Readonly parameters

When a function does not mutate an array or object parameter, type it as
`readonly`:

```ts
// BAD: Nothing prevents mutation of input
function first(items: string[]): string | undefined {
  return items.shift(); // Mutates the caller's array
}

// GOOD: Compile error on mutation
function first(items: readonly string[]): string | undefined {
  return items[0];
}

// Same for objects
function formatUser(user: Readonly<User>): string {
  return `${user.name.trim()} <${user.email}>`;
}
```

`readonly T[]` and `Readonly<T>` parameters accept mutable arguments, so
callers are not forced to change their own types.

### Prefer object over Object

- Use `object` (lowercase) for "any non-primitive value"
- Avoid `Object` (uppercase) -- matches primitives via autoboxing
- `{}` is `NonNullable<unknown>` -- use only when that is the intent

```ts
// BAD: Object accepts primitives
function process(value: Object) { /* ... */ }
process("hello"); // No error -- surprising

// GOOD: object excludes primitives
function process(value: object) { /* ... */ }
process("hello"); // Error
```

### Assertion functions vs type predicates

```ts
// Type predicate: returns boolean, narrows in the truthy branch
function isUser(value: unknown): value is User {
  return typeof value === "object" && value !== null && "id" in value;
}
if (isUser(data)) { data.id; }

// Assertion function: throws on failure, narrows after the call
function assertUser(value: unknown): asserts value is User {
  if (typeof value !== "object" || value === null || !("id" in value)) {
    throw new Error("Expected User");
  }
}
assertUser(data);
data.id; // narrowed -- no if/else needed
```

Use type predicates when branching. Use assertion functions when invalid data
is fatal (beforeEach setup, validation middleware, initialization code).

### Generic constraints

Constrain type parameters to the minimum shape the function needs:

```ts
// GOOD: Constrained to types with a length property
function getLength<T extends { length: number }>(value: T): number {
  return value.length;
}
getLength("hello");   // OK
getLength([1, 2, 3]); // OK
getLength(42);        // Error
```

### Function overloads vs conditional return types

When return type differs based on input type:

```ts
// Option A: Overloads -- type-safe body, verbose signatures
function parse(input: string): Date;
function parse(input: number): string;
function parse(input: string | number): Date | string {
  if (typeof input === "string") return new Date(input);
  return String(input);
}

// Option B: Conditional return type -- cleaner call site, body needs assertions
type ParseResult<T> = T extends string ? Date : T extends number ? string : never;
function parse<T extends string | number>(input: T): ParseResult<T> {
  if (typeof input === "string") return new Date(input) as ParseResult<T>;
  return String(input) as ParseResult<T>;
}
```

Prefer overloads when the body needs type safety. Prefer conditionals when
call-site ergonomics matter more.

**Note on `as` in generic bodies:** Option B uses `as ParseResult<T>` inside the
function body. This is an accepted tradeoff -- TypeScript's control flow analysis
cannot narrow conditional return types within generic functions. This is distinct
from the anti-pattern of using `as` at system boundaries to bypass runtime
validation.

### Module augmentation

Interfaces support declaration merging for augmenting third-party types:

```ts
declare module "express" {
  interface Request {
    user?: { id: string; role: string };
    requestId: string;
  }
}

declare global {
  interface Window {
    analytics: AnalyticsClient;
  }
}
```

Only use declaration merging when the runtime actually provides the merged
properties (e.g., via middleware).

### Async patterns

```ts
// Always type async return explicitly for public APIs
async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}

// Promise.all preserves tuple types
const [user, posts] = await Promise.all([
  fetchUser(id),   // Promise<User>
  fetchPosts(id),  // Promise<Post[]>
]);

// Promise.allSettled returns a discriminated union per element
const results = await Promise.allSettled([fetchUser(id), fetchPosts(id)]);
for (const result of results) {
  if (result.status === "fulfilled") {
    console.log(result.value);
  }
}

// Awaited<T> unwraps nested Promises
type Inner = Awaited<Promise<Promise<string>>>; // string
```

**Floating promises** are the most common async mistake. Enable
`typescript-eslint`'s `no-floating-promises` to catch unawaited promises.

### Testing patterns

```ts
// BAD: Using `as any` for test objects
const mockUser = { id: "1" } as any as User;

// GOOD: Typed factory functions
function createTestUser(overrides: Partial<User> = {}): User {
  return {
    id: "test-id",
    name: "Test User",
    email: "test@example.com",
    createdAt: new Date(),
    ...overrides,
  };
}

// GOOD: Type-safe mocks (Vitest 1.x+)
const mockFetch = vi.fn<typeof fetchUser>();

// GOOD: satisfies for test data
const testConfig = {
  port: 3000,
  host: "localhost",
} satisfies Partial<AppConfig>;
```
