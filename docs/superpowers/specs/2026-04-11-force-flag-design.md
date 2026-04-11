# `--force` Flag Design

## Summary

Add a `--force` CLI flag to `freezedts` that bypasses timestamp comparison and regenerates all `.freezed.ts` files unconditionally.

## Motivation

There is currently no way to force regeneration of freezed files. If a `.freezed.ts` output file has a newer timestamp than its source (e.g., after a git checkout, manual edit of generated files, or clock skew), the generator skips it. The `--force` flag provides an escape hatch to guarantee all outputs are regenerated.

## Design

### Interface & Parsing

`CliArgs` gains a `force: boolean` field:

```typescript
export interface CliArgs {
  watch: boolean;
  force: boolean;
  dir: string;
  config?: string;
}
```

`parseArgs()` recognizes `--force` with no shorthand alias:

```typescript
} else if (arg === '--force') {
  force = true;
}
```

### Validation

`--force` and `--watch` are mutually exclusive. Validation occurs immediately after argument parsing, before any file discovery:

```typescript
if (args.force && args.watch) {
  console.error('freezedts: --force and --watch cannot be used together');
  process.exit(1);
}
```

### Main Flow Bypass

The existing `filterChangedFiles()` call is conditionally bypassed. When `--force` is set, all discovered source files are passed directly to `generate()`:

```typescript
const { changed, skipped } = args.force
  ? { changed: allFiles, skipped: 0 }
  : filterChangedFiles(allFiles);
```

`filterChangedFiles()` itself is untouched. The bypass is a CLI-level concern.

The rest of the flow (generate, logging, error handling) is unchanged. With `skipped: 0`, the "unchanged" log line naturally does not appear.

### Testing

1. `parseArgs` correctly parses `--force` to `{ force: true }`
2. `parseArgs` without `--force` defaults to `{ force: false }`
3. `--force` combined with a positional directory works
4. `--force` + `--watch` together produces an error and exits

No changes to `filterChangedFiles` tests.

## Files Changed

- `packages/freezedts-cli/src/cli.ts` — `CliArgs` interface, `parseArgs()`, `main()`
- CLI test file — new `--force` parsing and validation tests
