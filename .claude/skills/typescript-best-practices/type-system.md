# Type System

## Table of Contents

- [Strict Mode](#strict-mode)
- [Discriminated Unions](#discriminated-unions)
- [Branded Types](#branded-types)
- [Template Literal Types](#template-literal-types)
- [Const Assertions](#const-assertions)
- [The satisfies Operator](#the-satisfies-operator)
- [NoInfer Utility Type](#noinfer-utility-type)
- [Type Narrowing](#type-narrowing)
- [Interface vs Type](#interface-vs-type)
- [Return Type Annotations](#return-type-annotations)
- [Utility Types](#utility-types)
- [Understanding never](#understanding-never)
- [Conditional Types](#conditional-types)
- [Mapped Types](#mapped-types)

---

## Strict Mode

Enable `strict: true` in every project. It is shorthand for a growing set of
compiler options including `strictNullChecks`, `strictFunctionTypes`,
`noImplicitAny`, `useUnknownInCatchVariables`, and `strictBuiltinIteratorReturn`
(added in TS 5.6).

Go further with additional flags:

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,   // arr[0] is T | undefined, not T
    "exactOptionalPropertyTypes": true, // { x?: string } does NOT accept undefined
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "noPropertyAccessFromIndexSignature": true
  }
}
```

`noUncheckedIndexedAccess` is the most impactful addition. Without it, array and
index-signature access silently returns the base type instead of `T | undefined`,
hiding potential runtime crashes.

`noPropertyAccessFromIndexSignature` forces bracket notation for index-signature
access, catching typos. Evaluate whether the benefit outweighs ergonomic cost
for your codebase.

`exactOptionalPropertyTypes` is excluded from `strict` because it causes friction
with libraries that assign `undefined` to optional properties. Most valuable for
internal domain code; less practical in framework-heavy codebases.

See [configuration.md](configuration.md) for full tsconfig recommendations.

---

## Discriminated Unions

Discriminated unions are the cornerstone for modeling variant types with
exhaustive type checking. Define a union of interfaces sharing a common literal
property (the discriminant).

```ts
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "rect"; width: number; height: number }
  | { kind: "triangle"; base: number; height: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "rect":
      return shape.width * shape.height;
    case "triangle":
      return (shape.base * shape.height) / 2;
    default:
      // Exhaustive check: compile error if a new variant is added
      const _exhaustive: never = shape;
      return _exhaustive;
  }
}
```

Prefer discriminated unions over the TypeScript `enum` keyword. See
[patterns.md](patterns.md) for detailed enum alternatives.

**Note:** This guidance is about TypeScript's `enum` keyword. GraphQL schema
enums are a separate concept -- see **graphql-best-practices** for those
conventions.

---

## Branded Types

TypeScript uses structural typing, so `UserId` and `ProductId` are
interchangeable if both are plain `string`. Branded types simulate nominal
typing:

```ts
declare const __brand: unique symbol;

type Brand<T, B extends string> = T & { readonly [__brand]: B };

type UserId = Brand<string, "UserId">;
type ProductId = Brand<string, "ProductId">;

// Factory functions are the only way to create branded values
function UserId(id: string): UserId {
  return id as UserId;
}

function ProductId(id: string): ProductId {
  return id as ProductId;
}

// Compile error: cannot pass UserId where ProductId is expected
function getProduct(id: ProductId): void { /* ... */ }

const userId = UserId("usr_123");
getProduct(userId); // Error
```

TypeScript has separate type and value namespaces, so a type alias and a
function can share the same name. The pattern above relies on this.

Common use cases: domain identifiers (UserId, OrderId), validated strings
(Email, Url), numeric constraints (PositiveNumber, Percentage), and
security-sensitive values (HashedPassword).

---

## Template Literal Types

Template literal types generate string types from unions using backtick syntax
in type positions:

```ts
type EventName = "click" | "focus" | "blur";
type Handler = `on${Capitalize<EventName>}`;
//   ^? "onClick" | "onFocus" | "onBlur"

type Module = "auth" | "billing";
type Setting = "enabled" | "timeout";
type ConfigKey = `${Module}.${Setting}`;
//   ^? "auth.enabled" | "auth.timeout" | "billing.enabled" | "billing.timeout"

// String format validation
type HexColor = `#${string}`;
type SemVer = `${number}.${number}.${number}`;
type CustomerKey = `cus_${string}`;
```

Intrinsic string manipulation types: `Uppercase<S>`, `Lowercase<S>`,
`Capitalize<S>`, `Uncapitalize<S>`.

**Performance warning:** Large unions cross-multiplied with template literals
grow multiplicatively and can cause IDE slowdowns. Avoid combining large unions.

---

## Const Assertions

`as const` narrows a value to its most specific literal type:

```ts
// Without: types are widened
const config = { port: 3000, host: "localhost" };
//    ^? { port: number; host: string }

// With: exact literal types preserved
const config = { port: 3000, host: "localhost" } as const;
//    ^? { readonly port: 3000; readonly host: "localhost" }
```

Use `as const` for:
- Configuration objects where exact values matter
- Route definitions (preserves the literal string)
- Tuple types (`[1, 2, 3] as const` gives `readonly [1, 2, 3]` not `number[]`)

---

## The satisfies Operator

`satisfies` validates that a value conforms to a type without widening the
inferred type. It sits between type annotations (which widen) and type assertions
(which bypass checking).

```ts
type Route = {
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
};

// Type annotation: widens -- method becomes the union type
const routeA: Route = { path: "/users", method: "GET" };
routeA.method; // ^? "GET" | "POST" | "PUT" | "DELETE"

// satisfies: validates AND preserves literal type
const routeB = { path: "/users", method: "GET" } satisfies Route;
routeB.method; // ^? "GET"
```

**When to use `satisfies`:**
1. Configuration objects where you want validation AND exact literal inference
2. Objects matching an interface where you need the narrower type downstream
3. Anywhere you would use `as` for validation -- use `satisfies` instead

**When to use type annotations:**
1. As the default for variable declarations with clear contracts
2. Function parameters and return types
3. When the wider type is what you actually want

**Combining with `as const`:**

```ts
const ROUTES = {
  home: "/",
  about: "/about",
} satisfies Record<string, string> as const;
// Type: { readonly home: "/"; readonly about: "/about" }
```

Order matters: `satisfies Type as const`, not the reverse.

---

## NoInfer Utility Type

`NoInfer<T>` (TS 5.4+) prevents a type parameter position from contributing to
inference, forcing the compiler to infer from other positions only:

```ts
// BAD: T inferred from BOTH items and defaultValue
function getFirst<T>(items: T[], defaultValue: T): T {
  return items[0] ?? defaultValue;
}
getFirst(["a", "b"], 42); // No error -- T is string | number

// GOOD: T inferred ONLY from items
function getFirst<T>(items: T[], defaultValue: NoInfer<T>): T {
  return items[0] ?? defaultValue;
}
getFirst(["a", "b"], 42);  // Error: number not assignable to string
```

Common use cases: default value parameters, callback return types constrained
by other parameters, event handler registrations.

**`NoInfer` vs `satisfies`:** `NoInfer<T>` works inside generic function
signatures to prevent a parameter from influencing inference. `satisfies` works
at value sites to validate without widening. Reach for `NoInfer` when writing
generic functions, and `satisfies` when constructing values.

---

## Type Narrowing

TypeScript's control-flow analysis narrows types after guards:

```ts
// typeof guards
if (typeof value === "string") { value.toUpperCase(); }

// Truthiness narrowing
if (value) { value.trim(); } // narrows out null/undefined

// in operator
if ("radius" in shape) { shape.radius; }

// instanceof
if (error instanceof TypeError) { error.message; }

// Array.isArray (improved in TS 5.x for readonly arrays)
if (Array.isArray(value)) { value.join(", "); }

// Type predicate functions
function isString(value: unknown): value is string {
  return typeof value === "string";
}

// Inferred type predicates (TS 5.5+)
const strings = mixed.filter((x) => typeof x === "string");
//    ^? string[] -- TS 5.5 infers the predicate automatically

// Assertion functions
function assertDefined<T>(value: T | null | undefined): asserts value is T {
  if (value == null) throw new Error("Expected defined value");
}
```

**Caveat: narrowing does not persist into callbacks or closures.** TypeScript
cannot guarantee a callback executes before a variable is reassigned:

```ts
let value: string | null = "hello";
if (value !== null) {
  setTimeout(() => {
    value.toUpperCase(); // Error: value is string | null again
  }, 0);
}

// Fix: capture in a const
const narrowed = value;
if (narrowed !== null) {
  setTimeout(() => { narrowed.toUpperCase(); }, 0); // OK
}
```

---

## Interface vs Type

Use `interface` for object shapes and `type` for everything else.

**Use `interface` when:**
- Defining object shapes -- interfaces are cached by name in the compiler,
  making them more performant for complex or deeply nested types
- You need declaration merging (extending third-party types)
- Extending other object shapes -- `interface C extends A` is resolved once
  and cached, unlike intersections

**Use `type` when:**
- Defining unions, intersections, mapped types, conditional types
- Discriminated unions naturally use `type` since interfaces cannot express unions
- Composing or transforming existing types

**Intersection pitfall -- silent `never`:**

```ts
type Broken = string & number; // never -- silent, unusable

interface A { value: string }
interface B { value: number }
type AB = A & B;
// AB["value"] is string & number = never
```

Always check that intersected types have compatible property types. Prefer
`interface extends` over intersection for object shapes -- the compiler caches
the result instead of re-evaluating structurally on every use.

---

## Return Type Annotations

Always annotate return types on exported/public API functions. This serves
three purposes:

1. **Documentation** -- readers see the contract without reading the body
2. **Error localization** -- type errors surface at the declaration, not distant call sites
3. **Performance** -- the compiler uses the named type instead of re-inferring

For internal helpers, let inference work.

```ts
// Exported: always annotate
export function getUser(id: string): Promise<User> {
  return db.user.findUniqueOrThrow({ where: { id } });
}

// Internal: let inference work
function buildWhereClause(filters: Filters) {
  return { ...filters, deletedAt: null };
}
```

Enforce with `typescript-eslint`'s `explicit-module-boundary-types` rule. For
stricter enforcement in libraries, `isolatedDeclarations` (see
[modern-features.md](modern-features.md)) requires explicit annotations on all
exports.

---

## Utility Types

TypeScript ships with powerful utility types. Know them; do not reinvent them.

```ts
Partial<T>          // all properties optional
Required<T>         // all properties required
Pick<T, K>          // select specific properties
Omit<T, K>          // remove specific properties
Record<K, V>        // object with specific key/value types
Readonly<T>         // all properties readonly
Extract<T, U>       // filter union members matching U
Exclude<T, U>       // filter union members not matching U
ReturnType<T>       // extract function return type
Parameters<T>       // extract function parameter types
Awaited<T>          // unwrap Promise types
NonNullable<T>      // remove null and undefined
```

**`Record<string, T>` pitfall:** Without `noUncheckedIndexedAccess`, accessing
any key returns `T` instead of `T | undefined`, hiding missing keys.

**When to use `Map` instead of `Record`:** For dynamic key-value stores where
keys are added/removed at runtime, prefer `Map<string, T>`. Map provides better
performance for frequent mutations, preserves insertion order, avoids prototype
pollution, and `.get()` already returns `T | undefined`.

Reserve `Record<K, V>` for static configuration objects and typed dictionaries
where the set of keys is known at the type level.

---

## Understanding never

`never` is TypeScript's bottom type -- a type with no possible values:

```ts
// Functions that never return
function throwError(message: string): never {
  throw new Error(message);
}

// Filtering with conditional types -- never members are removed from unions
type NonString<T> = T extends string ? never : T;
type Result = NonString<string | number | boolean>; // number | boolean

// The "never distribution" trap
type IsNever<T> = T extends never ? true : false;
type Test = IsNever<never>; // never (not true!)

// Fix: wrap in a tuple to prevent distribution
type IsNever<T> = [T] extends [never] ? true : false;
type Test = IsNever<never>; // true

// Impossible property access
type OnlyA = { a: string; b?: never };
```

---

## Conditional Types

Conditional types enable type-level logic:

```ts
// Basic conditional
type IsString<T> = T extends string ? true : false;

// Extracting inner types with infer
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
type ElementOf<T> = T extends readonly (infer E)[] ? E : never;

// Distributive conditional types (distributes over unions)
type ToArray<T> = T extends unknown ? T[] : never;
type Spread = ToArray<string | number>; // string[] | number[]

// Prevent distribution with tuple wrapping
type ToArrayNonDist<T> = [T] extends [unknown] ? T[] : never;
type Mapped = ToArrayNonDist<string | number>; // (string | number)[]
```

The `infer` keyword declares a type variable inside the `extends` clause:

```ts
type ReturnOf<T> = T extends (...args: any[]) => infer R ? R : never;
type First<T> = T extends [infer F, ...any[]] ? F : never;
type MapTypes<T> = T extends Map<infer K, infer V> ? { key: K; value: V } : never;
```

Common `infer` mistakes: using it outside a conditional's `extends` clause, and
forgetting that `infer` in a contravariant position produces an intersection
while in a covariant position it produces a union.

---

## Mapped Types

Mapped types transform existing types property by property:

```ts
// Make all properties nullable
type Nullable<T> = { [K in keyof T]: T[K] | null };

// Remap keys with `as` clause
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

// Filter properties by value type
type StringKeys<T> = {
  [K in keyof T as T[K] extends string ? K : never]: T[K];
};
```
