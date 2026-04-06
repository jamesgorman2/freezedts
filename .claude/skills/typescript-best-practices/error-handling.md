# Error Handling

## Table of Contents

- [Why Exceptions Lack Type Safety](#why-exceptions-lack-type-safety)
- [The Result Pattern](#the-result-pattern)
- [When to Use Each Pattern](#when-to-use-each-pattern)
- [Typed Error Hierarchies](#typed-error-hierarchies)
- [Library Options](#library-options)
- [Runtime Validation at System Boundaries](#runtime-validation-at-system-boundaries)
- [GraphQL Service Boundary Note](#graphql-service-boundary-note)

---

## Why Exceptions Lack Type Safety

TypeScript types caught errors as `unknown` (with `useUnknownInCatchVariables`
in strict mode), but the fundamental problem is that exceptions are invisible
in function signatures. Callers have no idea what errors a function can throw:

```ts
// What errors can this throw? Nothing in the signature tells you.
function parseConfig(raw: string): Config {
  const data = JSON.parse(raw);       // SyntaxError
  if (!data.version) throw new Error("Missing version");
  if (data.version > 3) throw new Error("Unsupported version");
  return data as Config;
}
```

---

## The Result Pattern

The Result pattern makes errors explicit in the return type, borrowing from
Rust's `Result<T, E>`:

```ts
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}
```

Usage with typed errors:

```ts
type ParseError =
  | { code: "INVALID_JSON"; message: string }
  | { code: "MISSING_VERSION" }
  | { code: "UNSUPPORTED_VERSION"; version: number };

function parseConfig(raw: string): Result<Config, ParseError> {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return err({ code: "INVALID_JSON", message: "Invalid JSON" });
  }

  if (typeof data !== "object" || data === null || !("version" in data)) {
    return err({ code: "MISSING_VERSION" });
  }

  if (typeof data.version === "number" && data.version > 3) {
    return err({ code: "UNSUPPORTED_VERSION", version: data.version });
  }

  return ok(data as Config);
}

// Caller is FORCED to handle the error case
const result = parseConfig(input);
if (!result.ok) {
  switch (result.error.code) {
    case "INVALID_JSON":
      console.error("Bad JSON:", result.error.message);
      break;
    case "MISSING_VERSION":
      console.error("Config missing version field");
      break;
    case "UNSUPPORTED_VERSION":
      console.error(`Version ${result.error.version} not supported`);
      break;
  }
  return;
}
// result.value is Config here -- narrowed by the ok check
```

---

## When to Use Each Pattern

| Scenario | Approach |
|---|---|
| Expected business logic failures | Result type |
| Validation errors | Result type |
| Network/IO that frequently fails | Result type |
| Programming bugs (null deref, bad index) | Exceptions |
| Truly exceptional situations | Exceptions |
| Third-party code boundaries | Catch and wrap into Result |

**Rule of thumb:** If a function *probably will* fail in normal operation, use
Result. If failure means a bug in the program, throw.

---

## Typed Error Hierarchies

Use discriminated unions for error types with exhaustive handling:

```ts
type ServiceError =
  | { code: "NOT_FOUND"; entity: string; id: string }
  | { code: "VALIDATION"; field: string; message: string }
  | { code: "UNAUTHORIZED"; requiredRole: string }
  | { code: "CONFLICT"; message: string };

function handleError(error: ServiceError): string {
  switch (error.code) {
    case "NOT_FOUND":
      return `${error.entity} with id ${error.id} not found`;
    case "VALIDATION":
      return `Validation failed on ${error.field}: ${error.message}`;
    case "UNAUTHORIZED":
      return `Requires role: ${error.requiredRole}`;
    case "CONFLICT":
      return error.message;
    default:
      const _exhaustive: never = error;
      return _exhaustive;
  }
}
```

Adding a new error code forces every handler to be updated at compile time.

---

## Library Options

### neverthrow

For larger codebases, `neverthrow` provides a full Result monad with chaining
and an ESLint plugin for unhandled Results:

```ts
import { ok, err, Result } from "neverthrow";

function divide(a: number, b: number): Result<number, "DIVISION_BY_ZERO"> {
  if (b === 0) return err("DIVISION_BY_ZERO");
  return ok(a / b);
}

const result = divide(10, 0)
  .map((n) => n * 2)
  .mapErr((e) => `Error: ${e}`);
```

### Effect

For a more comprehensive approach that also addresses dependency injection,
concurrency, and resource management, the `effect` library (effect-ts) reached
1.0 stable in 2024. Effect uses a three-channel type
`Effect<Success, Error, Requirements>` that makes errors, dependencies, and
success values all explicit. It is a larger commitment than `neverthrow` but
offers a unified framework for complex applications.

**Decision rule:** Use `neverthrow` for targeted Result-pattern adoption in an
otherwise conventional codebase. Consider `effect` only for greenfield projects
that want a unified functional framework for errors, dependencies, and
concurrency.

---

## Runtime Validation at System Boundaries

TypeScript's type system is erased at runtime. At system boundaries -- API
responses, form input, environment variables, file parsing -- use Zod, Valibot,
or ArkType for runtime validation:

```ts
import { z } from "zod";

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
});
type User = z.infer<typeof UserSchema>;

// .parse() throws on failure
const user = UserSchema.parse(untrustedData);

// .safeParse() returns a Result-like object -- aligns with the Result pattern
const result = UserSchema.safeParse(untrustedData);
if (!result.success) {
  console.error(result.error.issues); // ZodIssue[]
} else {
  result.data; // User -- safely validated
}
```

These libraries complement compile-time checking by producing validated, typed
values at the exact point where untyped data enters the application.

---

## GraphQL Service Boundary Note

The Result pattern is for pure TypeScript service-to-service code. At GraphQL
service boundaries, the convention is different: services throw `ServiceError`
with typed discriminated union codes rather than returning Result types. The
resolver layer catches `ServiceError` and translates it to GraphQL error
representations.

See **graphql-server-best-practices** for the `ServiceError` pattern, the
hybrid error strategy, and the full resolver-service boundary conventions.
