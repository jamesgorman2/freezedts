# Conditional __freezedDeepEqual Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Use `===` or `Object.is` for primitive properties in deep equality mode, and conditionally omit the `__freezedDeepEqual` helper when no property needs it.

**Architecture:** In `emitEqualsMethod`, deep-mode comparisons for primitives use `===` (string, boolean, bigint) or `Object.is` (number, for NaN safety). The `__freezedDeepEqual` helper is only emitted when at least one class in deep mode has a non-primitive property. Follows the same pattern as the existing conditional `__freezedDeepFreeze` emission.

**Tech Stack:** TypeScript 6, bun:test

---

### Task 1: Primitive comparisons in deep equality and conditional helper

**Files:**
- Modify: `src/generator/emitter.ts:5-11,249-261`
- Modify: `src/generator/emitter.test.ts`

- [ ] **Step 1: Write test — primitives use === and Object.is in deep mode**

Add to `src/generator/emitter.test.ts`:

```typescript
it('generates === for string/boolean and Object.is for number in deep equality mode', () => {
  const classes: ParsedFreezedClass[] = [
    {
      className: 'Record',
      generatedClassName: '$Record',
      hasDefaults: false,
      hasAsserts: false,
      equalityMode: 'deep',
      properties: [
        { name: 'label', type: 'string', optional: false, hasDefault: false, hasAssert: false, hasMessage: false, isFreezed: false },
        { name: 'count', type: 'number', optional: false, hasDefault: false, hasAssert: false, hasMessage: false, isFreezed: false },
        { name: 'active', type: 'boolean', optional: false, hasDefault: false, hasAssert: false, hasMessage: false, isFreezed: false },
        { name: 'tags', type: 'string[]', optional: false, hasDefault: false, hasAssert: false, hasMessage: false, isFreezed: false },
      ],
    },
  ];
  const output = emitFreezedFile(classes);
  // string → ===
  expect(output).toContain('this.label === other.label');
  // number → Object.is (NaN-safe)
  expect(output).toContain('Object.is(this.count, other.count)');
  // boolean → ===
  expect(output).toContain('this.active === other.active');
  // string[] → still uses __freezedDeepEqual
  expect(output).toContain('__freezedDeepEqual(this.tags, other.tags)');
});
```

- [ ] **Step 2: Write test — __freezedDeepEqual omitted for all-primitive deep classes**

```typescript
it('omits __freezedDeepEqual helper when all deep-mode properties are primitive', () => {
  const classes: ParsedFreezedClass[] = [
    {
      className: 'Person',
      generatedClassName: '$Person',
      hasDefaults: false,
      hasAsserts: false,
      equalityMode: 'deep',
      properties: [
        { name: 'name', type: 'string', optional: false, hasDefault: false, hasAssert: false, hasMessage: false, isFreezed: false },
        { name: 'age', type: 'number', optional: false, hasDefault: false, hasAssert: false, hasMessage: false, isFreezed: false },
      ],
    },
  ];
  const output = emitFreezedFile(classes);
  expect(output).not.toContain('__freezedDeepEqual');
  expect(output).toContain('this.name === other.name');
  expect(output).toContain('Object.is(this.age, other.age)');
});
```

- [ ] **Step 3: Write test — optional number with | undefined still uses Object.is**

```typescript
it('uses Object.is for number | undefined in deep equality mode', () => {
  const classes: ParsedFreezedClass[] = [
    {
      className: 'Counter',
      generatedClassName: '$Counter',
      hasDefaults: true,
      hasAsserts: false,
      equalityMode: 'deep',
      properties: [
        { name: 'count', type: 'number | undefined', optional: true, hasDefault: true, hasAssert: false, hasMessage: false, isFreezed: false },
      ],
    },
  ];
  const output = emitFreezedFile(classes);
  expect(output).toContain('Object.is(this.count, other.count)');
  expect(output).not.toContain('__freezedDeepEqual');
});
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `bun test src/generator/emitter.test.ts`
Expected: All three new tests FAIL.

- [ ] **Step 5: Update emitEqualsMethod to use === and Object.is for primitives**

In `src/generator/emitter.ts`, replace the deep-mode branch in `emitEqualsMethod` (line 250-252):

```typescript
// old
  const comparisons = cls.properties.map((p) => {
    if (cls.equalityMode === 'deep') {
      return `__freezedDeepEqual(this.${p.name}, other.${p.name})`;
    }
// new
  const comparisons = cls.properties.map((p) => {
    if (cls.equalityMode === 'deep') {
      const baseType = p.type.replace(/\s*\|\s*undefined$/, '').trim();
      if (baseType === 'number') {
        return `Object.is(this.${p.name}, other.${p.name})`;
      }
      if (PRIMITIVE_TYPES.has(baseType)) {
        return `this.${p.name} === other.${p.name}`;
      }
      return `__freezedDeepEqual(this.${p.name}, other.${p.name})`;
    }
```

- [ ] **Step 6: Make __freezedDeepEqual emission conditional**

In `emitFreezedFile` (lines 5-11), replace the helper emission block:

```typescript
// old
  const needsWith = classes.some(c => c.copyWith !== false);
  const needsEqual = classes.some(c => c.equal !== false);

  const helpers: string[] = [];
  if (needsWith) helpers.push(emitDeepCopyHelper());
  if (needsEqual) helpers.push(emitDeepEqualHelper());
// new
  const needsWith = classes.some(c => c.copyWith !== false);
  const needsDeepEqual = classes.some(c =>
    c.equal !== false && c.equalityMode === 'deep' && c.properties.some(p => {
      const baseType = p.type.replace(/\s*\|\s*undefined$/, '').trim();
      return !PRIMITIVE_TYPES.has(baseType);
    })
  );

  const helpers: string[] = [];
  if (needsWith) helpers.push(emitDeepCopyHelper());
  if (needsDeepEqual) helpers.push(emitDeepEqualHelper());
```

- [ ] **Step 7: Update existing tests that now break**

**A.** Test 'generates __freezedDeepEqual helper' (line 328) — class has only `name: string`, helper no longer emitted. Add a non-primitive property:

```typescript
it('generates __freezedDeepEqual helper when non-primitive properties exist', () => {
  const classes: ParsedFreezedClass[] = [
    {
      className: 'Team',
      generatedClassName: '$Team',
      hasDefaults: false, hasAsserts: false,
      equalityMode: 'deep',
      properties: [
        { name: 'name', type: 'string', optional: false, hasDefault: false, hasAssert: false, hasMessage: false, isFreezed: false },
        { name: 'members', type: 'string[]', optional: false, hasDefault: false, hasAssert: false, hasMessage: false, isFreezed: false },
      ],
    },
  ];
  const output = emitFreezedFile(classes);
  expect(output).toContain('__freezedDeepEqual');
});
```

**B.** Test 'generates equals() method with deep comparison' (line 344) — has `name: string` and `age: number`. Update assertions:

```typescript
// old
    expect(output).toContain('__freezedDeepEqual(this.name, other.name)');
    expect(output).toContain('__freezedDeepEqual(this.age, other.age)');
// new
    expect(output).toContain('this.name === other.name');
    expect(output).toContain('Object.is(this.age, other.age)');
```

**C.** Test 'includes equals() method when equal is true' (line 632) — class has only `name: string`. Helper not emitted. Change assertion:

```typescript
// old
    expect(output).toContain('__freezedDeepEqual');
// new
    expect(output).not.toContain('__freezedDeepEqual');
    expect(output).toContain('this.name === other.name');
```

**D.** Test 'includes equals() method when equal is undefined (default)' (line 650) — same change:

```typescript
// old
    expect(output).toContain('__freezedDeepEqual');
// new
    expect(output).not.toContain('__freezedDeepEqual');
    expect(output).toContain('this.name === other.name');
```

**E.** Test 'generates equals() with correct indentation' (line 733) — has `a: string` and `b: string`. Update assertions:

```typescript
// old
    expect(output).toContain('return __freezedDeepEqual(this.a, other.a)');
    expect(output).not.toContain('return     __freezedDeepEqual');
// new
    expect(output).toContain('return this.a === other.a');
    expect(output).not.toContain('return     this.a');
```

**F.** Test 'generates __freezedDeepEqual with Map and Set support' (line 752) — class has only `name: string`, helper won't be emitted. Add a non-primitive property so the helper IS emitted:

```typescript
it('generates __freezedDeepEqual with Map and Set support', () => {
  const classes: ParsedFreezedClass[] = [
    {
      className: 'Simple',
      generatedClassName: '$Simple',
      hasDefaults: false, hasAsserts: false,
      equalityMode: 'deep',
      properties: [
        { name: 'name', type: 'string', optional: false, hasDefault: false, hasAssert: false, hasMessage: false, isFreezed: false },
        { name: 'data', type: 'Record<string, unknown>', optional: false, hasDefault: false, hasAssert: false, hasMessage: false, isFreezed: false },
      ],
    },
  ];
  const output = emitFreezedFile(classes);
  expect(output).toContain('instanceof Map');
  expect(output).toContain('instanceof Set');
});
```

**G.** Test 'generates __freezedDeepEqual with NaN handling' (line 769) — class has only `value: number`. Number uses `Object.is`, helper not needed. Add a non-primitive property:

```typescript
it('generates __freezedDeepEqual with NaN handling', () => {
  const classes: ParsedFreezedClass[] = [
    {
      className: 'Simple',
      generatedClassName: '$Simple',
      hasDefaults: false, hasAsserts: false,
      equalityMode: 'deep',
      properties: [
        { name: 'value', type: 'number', optional: false, hasDefault: false, hasAssert: false, hasMessage: false, isFreezed: false },
        { name: 'data', type: 'Record<string, unknown>', optional: false, hasDefault: false, hasAssert: false, hasMessage: false, isFreezed: false },
      ],
    },
  ];
  const output = emitFreezedFile(classes);
  expect(output).toContain('Number.isNaN');
});
```

**H.** Test 'emits __freezedDeepEqual helper only when at least one class has equal enabled' (line 813) — WithEq has only `value: number`. Add a non-primitive property to WithEq:

Change the `value` property in the WithEq class from `type: 'number'` to `type: 'string[]'`:

```typescript
// old (line 832)
          { name: 'value', type: 'number', optional: false, hasDefault: false, hasAssert: false, hasMessage: false, isFreezed: false },
// new
          { name: 'items', type: 'string[]', optional: false, hasDefault: false, hasAssert: false, hasMessage: false, isFreezed: false },
```

- [ ] **Step 8: Run emitter tests**

Run: `bun test src/generator/emitter.test.ts`
Expected: All tests pass.

- [ ] **Step 9: Regenerate fixtures and run full suite**

```bash
find tests -name '*.ts' ! -name '*.freezed.ts' ! -name '*.test.ts' -exec touch {} +
bun src/cli.ts tests
bun test
```

Expected: All tests pass. The NaN integration test (`tests/equality/nan-equality.test.ts`) should still pass because `Object.is(NaN, NaN)` returns `true`.

- [ ] **Step 10: Commit**

```bash
git add src/generator/emitter.ts src/generator/emitter.test.ts tests/
git commit -m "perf: use === and Object.is for primitives in deep equality, conditionally emit __freezedDeepEqual"
```
