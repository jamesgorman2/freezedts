---
name: typescript-best-practices
description: >
  Use when writing or reviewing TypeScript code, configuring tsconfig.json,
  choosing between type aliases and interfaces, designing discriminated unions
  or branded types, handling errors with the Result pattern, validating data
  at system boundaries with Zod or Valibot, deciding whether to use the enum
  keyword, optimizing type-checking performance, or adopting modern TS 5.0-5.8
  features such as satisfies, using declarations, or const type parameters.
---

# TypeScript Best Practices

## Overview

Write TypeScript with strict mode as the foundation, discriminated unions as the
primary modeling tool, and explicit types at module boundaries. Prefer the type
system to encode invariants at compile time rather than relying on runtime checks
alone, and validate with Zod/Valibot where untyped data enters the application.

## Topics

- See [type-system.md](type-system.md) -- when designing types, choosing between interface and type, using discriminated unions, branded types, template literals, const assertions, satisfies, NoInfer, or narrowing patterns
- See [configuration.md](configuration.md) -- when setting up or reviewing tsconfig.json for bundler or Node.js projects, configuring path aliases, or setting up typescript-eslint
- See [error-handling.md](error-handling.md) -- when implementing error handling in pure TypeScript code using the Result pattern, typed error hierarchies, or runtime validation at system boundaries
- See [patterns.md](patterns.md) -- when deciding between unknown and any, using ts-expect-error, avoiding common anti-patterns, or applying recommended patterns like readonly parameters and assertion functions
- See [performance.md](performance.md) -- when type-checking is slow, configuring monorepo builds, or evaluating TypeScript Native (tsgo)
- See [modern-features.md](modern-features.md) -- when adopting TS 5.0+ features such as Stage 3 decorators, using declarations, import attributes, const type parameters, inferred predicates, isolatedDeclarations, or TS 5.7-5.8 additions
- See [references.md](references.md) -- when looking up source material, documentation links, or expert references for TypeScript configuration, patterns, error handling, modern features, or performance

## Cross-References

- **graphql-server-best-practices** -- when working at GraphQL service boundaries where services throw `ServiceError` with typed codes rather than returning Result types
- **graphql-best-practices** -- when dealing with GraphQL enum conventions (SCREAMING_SNAKE_CASE schema enums are distinct from the TypeScript `enum` keyword guidance here)

## Anti-Patterns

- Using `any` instead of `unknown` for untyped data -- `any` is contagious and silently disables type checking
- Using `as` assertions instead of runtime validation at system boundaries -- assertions lie to the compiler
- Using TypeScript's `enum` keyword for new code -- prefer union types or `as const` objects
- Over-engineering types with deep conditional/recursive generics -- if a colleague cannot understand a type in 30 seconds, simplify it
- Omitting return type annotations on exported functions -- forces the compiler to re-infer complex types at every call site
