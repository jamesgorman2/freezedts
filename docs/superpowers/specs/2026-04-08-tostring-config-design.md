# toString Configuration Support

## Summary

Add a `toString` boolean configuration option (default: `true`) to control whether `toString()` methods are generated for `@freezed` classes. Follows the existing `copyWith`/`equal` pattern exactly.

## Decorator API

Add `toString?: boolean` to `FreezedOptions`:

```typescript
@freezed({ toString: false })          // skip toString() generation
@freezed({ copyWith: false, equal: false, toString: false })  // only immutability
```

## Project-Wide Config

Add to `freezedts.config.yaml`:

```yaml
freezed:
  options:
    toString: false   # Disable toString() globally
```

## Resolution Order

Same as existing options:

```
Per-class @freezed() → freezedts.config.yaml → built-in defaults (true)
(highest priority)                              (lowest priority)
```

## Changes by File

1. **`src/runtime/freezed.ts`** — add `toString?: boolean` to `FreezedOptions`
2. **`src/generator/config.ts`** — add `toString: boolean` to `ResolvedConfig`, `DEFAULTS`, `FreezedConfigFile`, and `resolveClassOptions()`
3. **`src/generator/parser.ts`** — extract `toString` from decorator options, add to `ParsedFreezedClass`
4. **`src/generator/generator.ts`** — resolve `toString` in Phase 3 via `resolveClassOptions()`
5. **`src/generator/emitter.ts`** — conditionally emit `toString()` method: `if (cls.toString !== false)`
6. **`README.md`** — update Configuration section with `toString` option, bump version
7. **`package.json`** — bump version to `0.11.0`
8. **Tests** — mirror existing `copyWith`/`equal` test patterns for unit and integration tests

## Notes

- No new helper functions needed (unlike `copyWith` which needs `__freezedWith`, or `equal` which needs `__freezedDeepEqual`)
- When all three options are disabled (`copyWith: false, equal: false, toString: false`), the generated class provides only immutability (frozen constructor + readonly properties)
