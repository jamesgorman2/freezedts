# `--force` Flag Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `--force` CLI flag that bypasses timestamp comparison and regenerates all `.freezed.ts` files unconditionally.

**Architecture:** Add `force: boolean` to `CliArgs`, parse `--force` in the handwritten arg parser, validate mutual exclusivity with `--watch`, and conditionally bypass `filterChangedFiles()` in `main()`. Approach A from the spec — bypass at call site, `filterChangedFiles` untouched.

**Tech Stack:** TypeScript, Bun Test

**Spec:** `docs/superpowers/specs/2026-04-11-force-flag-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `packages/freezedts-cli/src/cli.ts` | Modify | `CliArgs` interface, `parseArgs()`, `main()` |
| `packages/freezedts-cli/src/cli.test.ts` | Modify | New tests for `--force` parsing and validation |

---

### Task 1: Add `--force` parsing tests

**Files:**
- Modify: `packages/freezedts-cli/src/cli.test.ts`

- [ ] **Step 1: Add test — parseArgs recognizes --force flag**

Add inside the existing `describe('parseArgs', () => { ... })` block, after the last `it()` at line 111:

```typescript
  it('parses --force flag', () => {
    expect(parseArgs(['node', 'cli.js', '--force'])).toEqual({
      watch: false,
      force: true,
      dir: '.',
      config: undefined,
    });
  });
```

- [ ] **Step 2: Add test — force defaults to false**

Add right after the previous test:

```typescript
  it('force defaults to false', () => {
    expect(parseArgs(['node', 'cli.js'])).toEqual({
      watch: false,
      force: false,
      dir: '.',
      config: undefined,
    });
  });
```

- [ ] **Step 3: Add test — --force combines with directory and config**

```typescript
  it('parses --force with directory and config', () => {
    expect(parseArgs(['node', 'cli.js', '--force', '--config', 'cfg.json', 'src'])).toEqual({
      watch: false,
      force: true,
      dir: 'src',
      config: 'cfg.json',
    });
  });
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `bun test packages/freezedts-cli/src/cli.test.ts`
Expected: FAIL — `parseArgs` returns objects without a `force` field.

- [ ] **Step 5: Commit failing tests**

```bash
git add packages/freezedts-cli/src/cli.test.ts
git commit -m "test: add failing tests for --force flag parsing"
```

---

### Task 2: Implement `--force` in `CliArgs` and `parseArgs`

**Files:**
- Modify: `packages/freezedts-cli/src/cli.ts:37-81`

- [ ] **Step 1: Add `force` to `CliArgs` interface**

In `packages/freezedts-cli/src/cli.ts`, change the `CliArgs` interface (lines 37-41) from:

```typescript
export interface CliArgs {
  watch: boolean;
  dir: string;
  config?: string;
}
```

to:

```typescript
export interface CliArgs {
  watch: boolean;
  force: boolean;
  dir: string;
  config?: string;
}
```

- [ ] **Step 2: Parse `--force` in `parseArgs()`**

In `parseArgs()` (lines 63-81), add `let force = false;` after `let watch = false;` (line 65), add a new branch in the for loop after the `--watch` check (after line 72):

```typescript
    } else if (arg === '--force') {
      force = true;
    }
```

And update the return statement from `return { watch, dir, config };` to:

```typescript
  return { watch, force, dir, config };
```

- [ ] **Step 3: Run tests to verify they pass**

Run: `bun test packages/freezedts-cli/src/cli.test.ts`
Expected: The 3 new tests PASS. Some existing `parseArgs` tests will FAIL because their `toEqual` expectations don't include `force: false`.

- [ ] **Step 4: Update existing `parseArgs` test expectations**

Every existing `toEqual` in the `parseArgs` describe block needs `force: false` added. Update each one:

In `'defaults to no watch and current directory'` (line 61):
```typescript
    expect(parseArgs(['node', 'cli.js'])).toEqual({ watch: false, force: false, dir: '.', config: undefined });
```

In `'parses --watch flag'` (line 65):
```typescript
    expect(parseArgs(['node', 'cli.js', '--watch'])).toEqual({ watch: true, force: false, dir: '.', config: undefined });
```

In `'parses -w shorthand'` (line 69):
```typescript
    expect(parseArgs(['node', 'cli.js', '-w'])).toEqual({ watch: true, force: false, dir: '.', config: undefined });
```

In `'parses positional directory argument'` (line 73):
```typescript
    expect(parseArgs(['node', 'cli.js', 'src'])).toEqual({ watch: false, force: false, dir: 'src', config: undefined });
```

In `'parses both --watch and directory in any order'` (lines 77-78):
```typescript
    expect(parseArgs(['node', 'cli.js', '--watch', 'src'])).toEqual({ watch: true, force: false, dir: 'src', config: undefined });
    expect(parseArgs(['node', 'cli.js', 'src', '-w'])).toEqual({ watch: true, force: false, dir: 'src', config: undefined });
```

In `'parses --config flag with path'` (lines 82-86):
```typescript
    expect(parseArgs(['node', 'cli.js', '--config', 'custom.json'])).toEqual({
      watch: false,
      force: false,
      dir: '.',
      config: 'custom.json',
    });
```

In `'parses -c shorthand for config'` (lines 90-94):
```typescript
    expect(parseArgs(['node', 'cli.js', '-c', 'my.json'])).toEqual({
      watch: false,
      force: false,
      dir: '.',
      config: 'my.json',
    });
```

In `'parses --config with --watch and directory'` (lines 98-102):
```typescript
    expect(parseArgs(['node', 'cli.js', '--watch', '--config', 'cfg.json', 'src'])).toEqual({
      watch: true,
      force: false,
      dir: 'src',
      config: 'cfg.json',
    });
```

In `'config is undefined when not specified'` (lines 106-110):
```typescript
    expect(parseArgs(['node', 'cli.js'])).toEqual({
      watch: false,
      force: false,
      dir: '.',
      config: undefined,
    });
```

- [ ] **Step 5: Run tests to verify all pass**

Run: `bun test packages/freezedts-cli/src/cli.test.ts`
Expected: ALL tests PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/freezedts-cli/src/cli.ts packages/freezedts-cli/src/cli.test.ts
git commit -m "feat: add --force flag to CliArgs and parseArgs"
```

---

### Task 3: Add mutual exclusivity validation and main flow bypass

**Files:**
- Modify: `packages/freezedts-cli/src/cli.ts:83-134`
- Modify: `packages/freezedts-cli/src/cli.test.ts`

- [ ] **Step 1: Add mutual exclusivity validation in `main()`**

In `packages/freezedts-cli/src/cli.ts`, in the `main()` function, add validation immediately after `const args = parseArgs(process.argv);` (line 84) and before `const resolvedDir` (line 85):

```typescript
  if (args.force && args.watch) {
    console.error('freezedts: --force and --watch cannot be used together');
    process.exit(1);
  }
```

- [ ] **Step 2: Add force bypass in main flow**

In `main()`, replace line 93:

```typescript
  const { changed, skipped } = filterChangedFiles(allFiles);
```

with:

```typescript
  const { changed, skipped } = args.force
    ? { changed: allFiles, skipped: 0 }
    : filterChangedFiles(allFiles);
```

- [ ] **Step 3: Run tests to verify nothing broke**

Run: `bun test packages/freezedts-cli/src/cli.test.ts`
Expected: ALL tests PASS (main() changes don't affect unit tests for parseArgs/filterChangedFiles).

- [ ] **Step 4: Commit**

```bash
git add packages/freezedts-cli/src/cli.ts
git commit -m "feat: add --force/--watch mutual exclusivity and timestamp bypass"
```
