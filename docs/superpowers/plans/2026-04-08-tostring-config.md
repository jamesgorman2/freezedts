# toString Configuration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `toString` boolean config option (default `true`) to control `toString()` generation, following the `copyWith`/`equal` pattern.

**Architecture:** Thread a `toString?: boolean` option through the same four-phase pipeline as `copyWith`/`equal`: decorator API -> parser extraction -> config resolution -> conditional emission.

**Tech Stack:** TypeScript, ts-morph, bun:test

---

### Task 1: Add `toString` to config types and resolution

**Files:**
- Modify: `src/generator/config.ts`
- Test: `src/generator/config.test.ts`

- [ ] **Step 1: Write failing tests for `loadConfig` and `resolveClassOptions` with `toString`**

In `src/generator/config.test.ts`, add these tests:

In the `loadConfig` describe block, after the `reads equal: false from yaml config` test:

```typescript
  it('reads toString: false from yaml config', () => {
    withTempDir((dir) => {
      const configPath = path.join(dir, 'freezedts.config.yaml');
      fs.writeFileSync(configPath, `freezed:\n  options:\n    toString: false\n`);

      const config = loadConfig(configPath);
      expect(config.toString).toBe(false);
      expect(config.copyWith).toBe(true);
      expect(config.equal).toBe(true);
    });
  });
```

Update the existing `returns built-in defaults when no config file exists` test to include `toString: true` in the expected object:

```typescript
      expect(config).toEqual({
        format: false,
        copyWith: true,
        equal: true,
        toString: true,
      });
```

Update the existing `reads all options together` test to include `toString: false`:

```typescript
      fs.writeFileSync(configPath, [
        'freezed:',
        '  options:',
        '    format: true',
        '    copyWith: false',
        '    equal: false',
        '    toString: false',
      ].join('\n'));

      const config = loadConfig(configPath);
      expect(config).toEqual({
        format: true,
        copyWith: false,
        equal: false,
        toString: false,
      });
```

Update the existing `handles empty yaml file gracefully` and `handles yaml with freezed key but no options` tests to expect `toString: true`:

```typescript
      expect(config).toEqual({
        format: false,
        copyWith: true,
        equal: true,
        toString: true,
      });
```

In the `resolveClassOptions` describe block, update `defaultConfig` and `disabledConfig`:

```typescript
  const defaultConfig: ResolvedConfig = { format: false, copyWith: true, equal: true, toString: true };
  const disabledConfig: ResolvedConfig = { format: false, copyWith: false, equal: false, toString: false };
```

Update the existing `uses config values when class options are undefined` test:

```typescript
    const result = resolveClassOptions({}, disabledConfig);
    expect(result).toEqual({ copyWith: false, equal: false, toString: false });
```

Update the existing `per-class true overrides config false` test:

```typescript
    const result = resolveClassOptions({ copyWith: true, equal: true, toString: true }, disabledConfig);
    expect(result).toEqual({ copyWith: true, equal: true, toString: true });
```

Update the existing `per-class false overrides config true` test:

```typescript
    const result = resolveClassOptions({ copyWith: false, equal: false, toString: false }, defaultConfig);
    expect(result).toEqual({ copyWith: false, equal: false, toString: false });
```

Update the existing `mixes per-class and config values` test:

```typescript
    const result = resolveClassOptions({ copyWith: false }, defaultConfig);
    expect(result).toEqual({ copyWith: false, equal: true, toString: true });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test src/generator/config.test.ts`
Expected: Multiple failures — `toString` property doesn't exist on `ResolvedConfig`, `resolveClassOptions` doesn't return it.

- [ ] **Step 3: Implement config changes**

In `src/generator/config.ts`:

Add `toString: boolean` to `ResolvedConfig`:

```typescript
export interface ResolvedConfig {
  format: boolean;
  copyWith: boolean;
  equal: boolean;
  toString: boolean;
}
```

Add `toString?: boolean` to `FreezedConfigFile.freezed.options`:

```typescript
interface FreezedConfigFile {
  freezed?: {
    options?: {
      format?: boolean;
      copyWith?: boolean;
      equal?: boolean;
      toString?: boolean;
    };
  };
}
```

Add `toString: true` to `DEFAULTS`:

```typescript
export const DEFAULTS: ResolvedConfig = {
  format: false,
  copyWith: true,
  equal: true,
  toString: true,
};
```

Add `toString` to `loadConfig` return:

```typescript
  return {
    format: options?.format ?? DEFAULTS.format,
    copyWith: options?.copyWith ?? DEFAULTS.copyWith,
    equal: options?.equal ?? DEFAULTS.equal,
    toString: options?.toString ?? DEFAULTS.toString,
  };
```

Add `toString` to `resolveClassOptions`:

```typescript
export function resolveClassOptions(
  cls: { copyWith?: boolean; equal?: boolean; toString?: boolean },
  config: ResolvedConfig,
): { copyWith: boolean; equal: boolean; toString: boolean } {
  return {
    copyWith: cls.copyWith ?? config.copyWith,
    equal: cls.equal ?? config.equal,
    toString: cls.toString ?? config.toString,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test src/generator/config.test.ts`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/generator/config.ts src/generator/config.test.ts
git commit -m "feat: add toString to config types and resolution"
```

---

### Task 2: Add `toString` to parser extraction

**Files:**
- Modify: `src/generator/parser.ts`
- Test: `src/generator/parser.test.ts`

- [ ] **Step 1: Write failing tests for toString extraction**

In `src/generator/parser.test.ts`, after the `extracts copyWith: true explicitly` test, add:

```typescript
  it('extracts toString: false from @freezed decorator', () => {
    const project = createTestProject(`
      import { freezed } from 'freezedts';

      @freezed({ toString: false })
      class Person {
        constructor(params: { name: string }) {}
      }
    `);

    const result = parseFreezedClasses(project.getSourceFile('test.ts')!);
    expect(result.classes[0].toString).toBe(false);
  });

  it('extracts toString: true explicitly', () => {
    const project = createTestProject(`
      import { freezed } from 'freezedts';

      @freezed({ toString: true })
      class Person {
        constructor(params: { name: string }) {}
      }
    `);

    const result = parseFreezedClasses(project.getSourceFile('test.ts')!);
    expect(result.classes[0].toString).toBe(true);
  });

  it('leaves toString undefined when not specified in decorator', () => {
    const project = createTestProject(`
      import { freezed } from 'freezedts';

      @freezed()
      class Person {
        constructor(params: { name: string }) {}
      }
    `);

    const result = parseFreezedClasses(project.getSourceFile('test.ts')!);
    expect(result.classes[0].toString).toBeUndefined();
  });
```

Update the existing `extracts both copyWith and equal when specified together` test to also test toString:

```typescript
  it('extracts copyWith, equal, and toString when specified together', () => {
    const project = createTestProject(`
      import { freezed } from 'freezedts';

      @freezed({ copyWith: false, equal: false, toString: false })
      class Person {
        constructor(params: { name: string }) {}
      }
    `);

    const result = parseFreezedClasses(project.getSourceFile('test.ts')!);
    expect(result.classes[0].copyWith).toBe(false);
    expect(result.classes[0].equal).toBe(false);
    expect(result.classes[0].toString).toBe(false);
  });
```

Update the existing `leaves copyWith/equal undefined when not specified in decorator` test:

```typescript
  it('leaves copyWith/equal/toString undefined when not specified in decorator', () => {
    // ... existing code ...
    expect(result.classes[0].copyWith).toBeUndefined();
    expect(result.classes[0].equal).toBeUndefined();
    expect(result.classes[0].toString).toBeUndefined();
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test src/generator/parser.test.ts`
Expected: Failures — `toString` not on `ParsedFreezedClass`, not extracted.

- [ ] **Step 3: Implement parser changes**

In `src/generator/parser.ts`:

Add `toString?: boolean` to `ParsedFreezedClass`:

```typescript
export interface ParsedFreezedClass {
  className: string;
  generatedClassName: string;
  properties: ParsedProperty[];
  hasDefaults: boolean;
  hasAsserts: boolean;
  equalityMode: 'deep' | 'shallow';
  copyWith?: boolean;
  equal?: boolean;
  toString?: boolean;
}
```

Update `extractGenerationOptions` to include `toString`:

```typescript
function extractGenerationOptions(decorator: Decorator): { copyWith?: boolean; equal?: boolean; toString?: boolean } {
  const args = decorator.getArguments();
  if (args.length === 0) return {};

  const optionsArg = args[0];
  if (!Node.isObjectLiteralExpression(optionsArg)) return {};

  return {
    copyWith: extractBooleanOption(optionsArg, 'copyWith'),
    equal: extractBooleanOption(optionsArg, 'equal'),
    toString: extractBooleanOption(optionsArg, 'toString'),
  };
}
```

Update `parseFreezedClasses` to destructure `toString` from `extractGenerationOptions` and include it in the result:

Change line 69 from:
```typescript
    const { copyWith, equal } = extractGenerationOptions(decorator);
```
to:
```typescript
    const { copyWith, equal, toString } = extractGenerationOptions(decorator);
```

Change the result push (lines 73-82) to include `toString`:
```typescript
    results.push({
      className,
      generatedClassName: `$${className}`,
      properties,
      hasDefaults,
      hasAsserts,
      equalityMode,
      ...(copyWith !== undefined && { copyWith }),
      ...(equal !== undefined && { equal }),
      ...(toString !== undefined && { toString }),
    });
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test src/generator/parser.test.ts`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/generator/parser.ts src/generator/parser.test.ts
git commit -m "feat: extract toString option from @freezed decorator"
```

---

### Task 3: Add `toString` to decorator API

**Files:**
- Modify: `src/runtime/freezed.ts`

- [ ] **Step 1: Add `toString?: boolean` to `FreezedOptions`**

```typescript
export interface FreezedOptions {
  equality?: 'deep' | 'shallow';
  copyWith?: boolean;
  equal?: boolean;
  toString?: boolean;
  fields?: Record<string, FieldConfig>;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/runtime/freezed.ts
git commit -m "feat: add toString option to FreezedOptions"
```

---

### Task 4: Wire `toString` through generator resolution

**Files:**
- Modify: `src/generator/generator.ts`

- [ ] **Step 1: Add `toString` to Phase 3 resolution**

In `src/generator/generator.ts`, update Phase 3 (lines 153-159) to also resolve `toString`:

```typescript
  // Phase 3: Resolve generation options — merge per-class with config defaults
  for (const { classes } of parsed.values()) {
    for (const cls of classes) {
      const resolved = resolveClassOptions(cls, resolvedConfig);
      cls.copyWith = resolved.copyWith;
      cls.equal = resolved.equal;
      cls.toString = resolved.toString;
    }
  }
```

- [ ] **Step 2: Run all tests to verify nothing breaks**

Run: `bun test`
Expected: All existing tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/generator/generator.ts
git commit -m "feat: resolve toString option in generator pipeline"
```

---

### Task 5: Conditionally emit `toString()` in emitter

**Files:**
- Modify: `src/generator/emitter.ts`
- Test: `src/generator/emitter.test.ts`

- [ ] **Step 1: Write failing tests for toString conditional emission**

In `src/generator/emitter.test.ts`, add these tests (after the `omits both with() and equals() when both disabled` test):

```typescript
  it('omits toString() method when toString is false', () => {
    const classes: ParsedFreezedClass[] = [
      {
        className: 'Person',
        generatedClassName: '$Person',
        hasDefaults: false, hasAsserts: false,
        equalityMode: 'deep',
        toString: false,
        properties: [
          { name: 'name', type: 'string', optional: false, hasDefault: false, hasAssert: false, hasMessage: false, isFreezed: false },
        ],
      },
    ];
    const output = emitFreezedFile(classes);
    expect(output).not.toContain('toString(): string');
    // Should still have with and equals
    expect(output).toContain('get with()');
    expect(output).toContain('equals(other: unknown): boolean');
  });

  it('includes toString() method when toString is true', () => {
    const classes: ParsedFreezedClass[] = [
      {
        className: 'Person',
        generatedClassName: '$Person',
        hasDefaults: false, hasAsserts: false,
        equalityMode: 'deep',
        toString: true,
        properties: [
          { name: 'name', type: 'string', optional: false, hasDefault: false, hasAssert: false, hasMessage: false, isFreezed: false },
        ],
      },
    ];
    const output = emitFreezedFile(classes);
    expect(output).toContain('toString(): string');
  });

  it('includes toString() method when toString is undefined (default)', () => {
    const classes: ParsedFreezedClass[] = [
      {
        className: 'Person',
        generatedClassName: '$Person',
        hasDefaults: false, hasAsserts: false,
        equalityMode: 'deep',
        properties: [
          { name: 'name', type: 'string', optional: false, hasDefault: false, hasAssert: false, hasMessage: false, isFreezed: false },
        ],
      },
    ];
    const output = emitFreezedFile(classes);
    expect(output).toContain('toString(): string');
  });

  it('omits all methods when copyWith, equal, and toString are all disabled', () => {
    const classes: ParsedFreezedClass[] = [
      {
        className: 'Bare',
        generatedClassName: '$Bare',
        hasDefaults: false, hasAsserts: false,
        equalityMode: 'deep',
        copyWith: false,
        equal: false,
        toString: false,
        properties: [
          { name: 'name', type: 'string', optional: false, hasDefault: false, hasAssert: false, hasMessage: false, isFreezed: false },
        ],
      },
    ];
    const output = emitFreezedFile(classes);
    expect(output).not.toContain('get with()');
    expect(output).not.toContain('equals(other: unknown)');
    expect(output).not.toContain('toString(): string');
    // Still has: header, params type, class, constructor
    expect(output).toContain('// generated by freezedts, do not edit');
    expect(output).toContain('export type BareParams');
    expect(output).toContain('export abstract class $Bare');
    expect(output).toContain('Object.freeze(this)');
  });
```

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `bun test src/generator/emitter.test.ts`
Expected: `omits toString() method when toString is false` fails — toString is still unconditionally emitted. The `omits all methods` test also fails.

- [ ] **Step 3: Implement conditional toString emission**

In `src/generator/emitter.ts`, change line 192 in `emitClassBody()` from:

```typescript
  methods.push(emitToStringMethod(cls));
```

to:

```typescript
  if (cls.toString !== false) methods.push(emitToStringMethod(cls));
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test src/generator/emitter.test.ts`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/generator/emitter.ts src/generator/emitter.test.ts
git commit -m "feat: conditionally emit toString() based on config"
```

---

### Task 6: Add integration tests and fixtures

**Files:**
- Create: `tests/config/fixtures/no-to-string.ts`
- Modify: `tests/config/fixtures/all-disabled.ts`
- Modify: `tests/config/config.test.ts`

- [ ] **Step 1: Create no-to-string fixture**

Create `tests/config/fixtures/no-to-string.ts`:

```typescript
import { freezed } from '../../../src/runtime/freezed.ts';
import { $NoToString } from './no-to-string.freezed.ts';

@freezed({ toString: false })
class NoToString extends $NoToString {
  constructor(params: { name: string; age: number }) {
    super(params);
  }
}

export { NoToString };
```

- [ ] **Step 2: Update all-disabled fixture**

Update `tests/config/fixtures/all-disabled.ts` to also disable toString:

```typescript
import { freezed } from '../../../src/runtime/freezed.ts';
import { $Minimal } from './all-disabled.freezed.ts';

@freezed({ copyWith: false, equal: false, toString: false })
class Minimal extends $Minimal {
  constructor(params: { name: string; value: number }) {
    super(params);
  }
}

export { Minimal };
```

- [ ] **Step 3: Add integration tests**

In `tests/config/config.test.ts`:

Add `no-to-string.ts` to the `beforeAll` generate call:

```typescript
beforeAll(() => {
  generate([
    path.join(fixturesDir, 'no-copy-with.ts'),
    path.join(fixturesDir, 'no-equal.ts'),
    path.join(fixturesDir, 'all-disabled.ts'),
    path.join(fixturesDir, 'no-to-string.ts'),
  ]);
});
```

Add a new describe block for `toString: false`:

```typescript
describe('per-class opt-out — toString: false', () => {
  it('does not generate toString()', async () => {
    const { NoToString } = await import('./fixtures/no-to-string.ts');
    const instance = new NoToString({ name: 'Alice', age: 30 });
    // toString() falls back to default Object.prototype.toString
    expect(instance.toString()).not.toContain('Alice');
  });

  it('still generates with()', async () => {
    const { NoToString } = await import('./fixtures/no-to-string.ts');
    const instance = new NoToString({ name: 'Alice', age: 30 });
    const updated = instance.with({ name: 'Bob' });
    expect(updated.name).toBe('Bob');
    expect(updated.age).toBe(30);
  });

  it('still generates equals()', async () => {
    const { NoToString } = await import('./fixtures/no-to-string.ts');
    const a = new NoToString({ name: 'Alice', age: 30 });
    const b = new NoToString({ name: 'Alice', age: 30 });
    expect(a.equals(b)).toBe(true);
  });

  it('is still frozen', async () => {
    const { NoToString } = await import('./fixtures/no-to-string.ts');
    const instance = new NoToString({ name: 'Alice', age: 30 });
    expect(Object.isFrozen(instance)).toBe(true);
  });
});
```

Update the existing `per-class opt-out — both disabled` describe block. Change the test title and assertions to reflect all three being disabled:

```typescript
describe('per-class opt-out — all disabled', () => {
  it('does not generate with, equals, or toString', async () => {
    const { Minimal } = await import('./fixtures/all-disabled.ts');
    const instance = new Minimal({ name: 'Alice', value: 42 });
    expect((instance as any).with).toBeUndefined();
    expect((instance as any).equals).toBeUndefined();
    expect(instance.toString()).not.toContain('Alice');
  });

  it('is still frozen with readonly properties', async () => {
    const { Minimal } = await import('./fixtures/all-disabled.ts');
    const instance = new Minimal({ name: 'Alice', value: 42 });
    expect(Object.isFrozen(instance)).toBe(true);
    expect(instance.name).toBe('Alice');
    expect(instance.value).toBe(42);
  });
});
```

Add a config-file level test for toString:

```typescript
  it('config toString: false disables toString() for all classes', () => {
    withTempDir((dir) => {
      const sourceFile = path.join(dir, 'person.ts');
      fs.writeFileSync(sourceFile, `
        import { freezed } from 'freezedts';

        @freezed()
        class Person {
          constructor(params: { name: string }) {}
        }
      `);

      generate([sourceFile], { format: false, copyWith: true, equal: true, toString: false });

      const content = fs.readFileSync(path.join(dir, 'person.freezed.ts'), 'utf-8');
      expect(content).not.toContain('toString(): string');
      expect(content).toContain('equals(other: unknown)');
      expect(content).toContain('get with()');
    });
  });
```

Update the existing config-file tests that pass `ResolvedConfig` objects to include `toString: true`:

```typescript
  // In 'config copyWith: false disables with() for all classes':
  generate([sourceFile], { format: false, copyWith: false, equal: true, toString: true });

  // In 'per-class copyWith: true overrides config copyWith: false':
  generate([sourceFile], { format: false, copyWith: false, equal: true, toString: true });

  // In 'config equal: false disables equals() for all classes':
  generate([sourceFile], { format: false, copyWith: true, equal: false, toString: true });

  // In 'format: true produces formatted output':
  generate([sourceFile], { format: true, copyWith: true, equal: true, toString: true });
```

- [ ] **Step 4: Run integration tests**

Run: `bun test tests/config/config.test.ts`
Expected: All tests pass.

- [ ] **Step 5: Run full test suite**

Run: `bun test`
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add tests/config/fixtures/no-to-string.ts tests/config/fixtures/all-disabled.ts tests/config/config.test.ts
git commit -m "test: add integration tests for toString configuration"
```

---

### Task 7: Update README.md and bump version

**Files:**
- Modify: `README.md`
- Modify: `package.json`

- [ ] **Step 1: Update README.md Configuration section**

In `README.md`, update the Per-Class Configuration section (around line 259):

```markdown
### Per-Class Configuration

Disable generation of specific methods via the `@freezed()` decorator:

\`\`\`ts
@freezed({ copyWith: false })   // skip with() generation
@freezed({ equal: false })      // skip equals() generation
@freezed({ toString: false })   // skip toString() generation
@freezed({ copyWith: false, equal: false, toString: false })  // only immutability
\`\`\`
```

Update the Project-Wide Configuration section (around line 274):

```markdown
### Project-Wide Configuration

Create a `freezedts.config.yaml` in your project root:

\`\`\`yaml
freezed:
  options:
    # Format generated .freezed.ts files (can slow down generation)
    format: true

    # Disable with() generation for the entire project
    copyWith: false

    # Disable equals() generation for the entire project
    equal: false

    # Disable toString() generation for the entire project
    toString: false
\`\`\`

All options default to `true` (enabled) except `format` which defaults to `false`.
```

- [ ] **Step 2: Bump version in `package.json`**

Change `"version": "0.10.0"` to `"version": "0.11.0"`.

- [ ] **Step 3: Commit**

```bash
git add README.md package.json
git commit -m "docs: add toString config to README, bump version to 0.11.0"
```

---

### Task 8: Regenerate fixture files and final verification

**Files:**
- Regenerate: `tests/config/fixtures/*.freezed.ts`

- [ ] **Step 1: Regenerate all fixture freezed files**

Run: `bun src/cli.ts tests/config/fixtures`

This regenerates the `.freezed.ts` files for the config fixtures, including the new `no-to-string.freezed.ts` and the updated `all-disabled.freezed.ts` (which now also omits `toString()`).

- [ ] **Step 2: Verify generated output**

Check that `no-to-string.freezed.ts` does NOT contain `toString(): string`.
Check that `all-disabled.freezed.ts` does NOT contain `toString(): string`.
Check that `no-copy-with.freezed.ts` and `no-equal.freezed.ts` still contain `toString(): string`.

- [ ] **Step 3: Run full test suite**

Run: `bun test`
Expected: All tests pass.

- [ ] **Step 4: Commit generated files**

```bash
git add tests/config/fixtures/*.freezed.ts
git commit -m "chore: regenerate fixture files with toString config support"
```
