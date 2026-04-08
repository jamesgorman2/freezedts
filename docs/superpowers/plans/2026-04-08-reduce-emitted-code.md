# Reduce Emitted Code Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate unnecessary code in generated `.freezed.ts` files by unrolling field config loops, conditionally emitting `__freezedDeepFreeze`, and validating defaults at build time.

**Architecture:** The parser gains per-field tracking (hasAssert, hasMessage). The emitter replaces the generic runtime loop with explicit per-field if-blocks and conditionally emits `__freezedDeepFreeze`. The generator validates that defaults pass their assertions at generation time using eval.

**Tech Stack:** TypeScript 6, ts-morph, bun:test

---

### File Map

| File | Tasks | Role |
|------|-------|------|
| `src/generator/parser.ts` | 1 | Add hasAssert/hasMessage to ParsedProperty, replace hasFieldConfig with hasDefaults/hasAsserts |
| `src/generator/parser.test.ts` | 1 | Update all ParsedProperty/ParsedFreezedClass assertions |
| `src/generator/emitter.ts` | 2, 3 | Unroll field config block, conditional deepFreeze |
| `src/generator/emitter.test.ts` | 2, 3 | Update field config tests, add deepFreeze conditional test |
| `src/generator/generator.ts` | 4 | Build-time default validation via eval |
| `src/generator/generator.test.ts` | 4 | Test validation catches bad defaults |

---

### Task 1: Parser — per-field metadata

**Files:**
- Modify: `src/generator/parser.ts`
- Modify: `src/generator/parser.test.ts`

- [ ] **Step 1: Update ParsedProperty interface**

In `src/generator/parser.ts`, replace the `ParsedProperty` interface (lines 3-10):

```typescript
// old
export interface ParsedProperty {
  name: string;
  type: string;
  optional: boolean;
  hasDefault: boolean;
  isFreezed: boolean;
  importFrom?: string;
}
// new
export interface ParsedProperty {
  name: string;
  type: string;
  optional: boolean;
  hasDefault: boolean;
  hasAssert: boolean;
  hasMessage: boolean;
  isFreezed: boolean;
  importFrom?: string;
}
```

- [ ] **Step 2: Update ParsedFreezedClass interface**

Replace the `ParsedFreezedClass` interface (lines 12-20):

```typescript
// old
export interface ParsedFreezedClass {
  className: string;
  generatedClassName: string;
  properties: ParsedProperty[];
  hasFieldConfig: boolean;
  equalityMode: 'deep' | 'shallow';
  copyWith?: boolean;
  equal?: boolean;
}
// new
export interface ParsedFreezedClass {
  className: string;
  generatedClassName: string;
  properties: ParsedProperty[];
  hasDefaults: boolean;
  hasAsserts: boolean;
  equalityMode: 'deep' | 'shallow';
  copyWith?: boolean;
  equal?: boolean;
}
```

- [ ] **Step 3: Update extractFieldConfig return type and logic**

Replace the entire `extractFieldConfig` function (lines 84-110):

```typescript
interface FieldConfigResult {
  hasDefaults: boolean;
  hasAsserts: boolean;
  defaultFields: Set<string>;
  assertFields: Set<string>;
  messageFields: Set<string>;
}

const NO_FIELD_CONFIG: FieldConfigResult = {
  hasDefaults: false,
  hasAsserts: false,
  defaultFields: new Set(),
  assertFields: new Set(),
  messageFields: new Set(),
};

function extractFieldConfig(decorator: Decorator): FieldConfigResult {
  const args = decorator.getArguments();
  if (args.length === 0) return NO_FIELD_CONFIG;

  const optionsArg = args[0];
  if (!Node.isObjectLiteralExpression(optionsArg)) return NO_FIELD_CONFIG;

  const fieldsProp = optionsArg.getProperty('fields');
  if (!fieldsProp || !Node.isPropertyAssignment(fieldsProp)) return NO_FIELD_CONFIG;

  const fieldsInit = fieldsProp.getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);
  if (!fieldsInit) return { hasDefaults: false, hasAsserts: false, defaultFields: new Set(), assertFields: new Set(), messageFields: new Set() };

  const defaultFields = new Set<string>();
  const assertFields = new Set<string>();
  const messageFields = new Set<string>();

  for (const prop of fieldsInit.getProperties()) {
    if (Node.isPropertyAssignment(prop)) {
      const fieldInit = prop.getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);
      if (fieldInit) {
        const name = prop.getName();
        if (fieldInit.getProperty('default')) defaultFields.add(name);
        if (fieldInit.getProperty('assert')) assertFields.add(name);
        if (fieldInit.getProperty('message')) messageFields.add(name);
      }
    }
  }

  return {
    hasDefaults: defaultFields.size > 0,
    hasAsserts: assertFields.size > 0,
    defaultFields,
    assertFields,
    messageFields,
  };
}
```

- [ ] **Step 4: Update extractProperties to accept and use new field sets**

Replace the `extractProperties` function signature and body (lines 155-171):

```typescript
function extractProperties(
  type: Type,
  defaultFields: Set<string>,
  assertFields: Set<string>,
  messageFields: Set<string>,
): ParsedProperty[] {
  return type.getProperties().map((prop: MorphSymbol) => {
    const propType = prop.getValueDeclaration()?.getType();
    const isOptional = prop.isOptional();

    let typeText = propType?.getText() ?? 'unknown';
    typeText = typeText.replace(/import\(.*?\)\./g, '');

    const name = prop.getName();
    return {
      name,
      type: typeText,
      optional: isOptional,
      hasDefault: defaultFields.has(name),
      hasAssert: assertFields.has(name),
      hasMessage: messageFields.has(name),
      isFreezed: false,
    };
  });
}
```

- [ ] **Step 5: Update parseFreezedClasses to use new field config shape**

In the `parseFreezedClasses` function, replace the destructuring and the class push (lines 64-78):

```typescript
// old
    const { hasFieldConfig, defaultFields } = extractFieldConfig(decorator);
    const equalityMode = extractEqualityMode(decorator);
    const { copyWith, equal } = extractGenerationOptions(decorator);
    const paramType = paramsParam.getType();
    const properties = extractProperties(paramType, defaultFields);

    results.push({
      className,
      generatedClassName: `$${className}`,
      properties,
      hasFieldConfig,
      equalityMode,
      ...(copyWith !== undefined && { copyWith }),
      ...(equal !== undefined && { equal }),
    });
// new
    const { hasDefaults, hasAsserts, defaultFields, assertFields, messageFields } = extractFieldConfig(decorator);
    const equalityMode = extractEqualityMode(decorator);
    const { copyWith, equal } = extractGenerationOptions(decorator);
    const paramType = paramsParam.getType();
    const properties = extractProperties(paramType, defaultFields, assertFields, messageFields);

    results.push({
      className,
      generatedClassName: `$${className}`,
      properties,
      hasDefaults,
      hasAsserts,
      equalityMode,
      ...(copyWith !== undefined && { copyWith }),
      ...(equal !== undefined && { equal }),
    });
```

- [ ] **Step 6: Update parser tests**

In `src/generator/parser.test.ts`, apply these changes throughout:

**A.** Replace all `hasFieldConfig: false` with `hasDefaults: false, hasAsserts: false` (in class-level `toEqual` assertions). Affected tests: 'extracts a single @freezed class' (line 32), and anywhere else `hasFieldConfig` appears in a class assertion.

**B.** Replace all occurrences of `{ name: ..., type: ..., optional: ..., hasDefault: ..., isFreezed: ... }` in property assertions by adding `hasAssert: false, hasMessage: false` after `hasDefault`:

For example, line 34:
```typescript
// old
{ name: 'firstName', type: 'string', optional: false, hasDefault: false, isFreezed: false },
// new
{ name: 'firstName', type: 'string', optional: false, hasDefault: false, hasAssert: false, hasMessage: false, isFreezed: false },
```

Apply this to ALL property objects in ALL `toEqual` calls in the file.

**C.** Update the 'detects hasFieldConfig' test (line 116) — the assertion becomes:
```typescript
// old
    expect(result.classes[0].hasFieldConfig).toBe(true);
// new
    expect(result.classes[0].hasDefaults).toBe(true);
    expect(result.classes[0].hasAsserts).toBe(false);
```

**D.** Update the 'sets hasDefault on properties' test (line 137) — this test has both a default field (`age`) and an assert field (`email`). Update the class assertion and property assertions:

```typescript
    expect(result.classes[0].hasDefaults).toBe(true);
    expect(result.classes[0].hasAsserts).toBe(true);
    expect(result.classes[0].properties).toEqual([
      { name: 'name', type: 'string', optional: false, hasDefault: false, hasAssert: false, hasMessage: false, isFreezed: false },
      { name: 'age', type: 'number', optional: true, hasDefault: true, hasAssert: false, hasMessage: false, isFreezed: false },
      { name: 'email', type: 'string', optional: false, hasDefault: false, hasAssert: true, hasMessage: false, isFreezed: false },
    ]);
```

**E.** Update the 'sets hasFieldConfig false' test (line 164):
```typescript
// old
    expect(result.classes[0].hasFieldConfig).toBe(false);
    expect(result.classes[0].properties[0].hasDefault).toBe(false);
// new
    expect(result.classes[0].hasDefaults).toBe(false);
    expect(result.classes[0].hasAsserts).toBe(false);
    expect(result.classes[0].properties[0].hasDefault).toBe(false);
```

**F.** Add a new test for hasAssert and hasMessage detection:

```typescript
it('sets hasAssert and hasMessage on properties with assert config', () => {
  const project = createTestProject(`
    import { freezed } from 'freezedts';

    @freezed({
      fields: {
        email: {
          assert: (v: string) => v.includes('@'),
          message: 'invalid email',
        },
        name: { assert: (v: string) => v.length > 0 },
      }
    })
    class Contact {
      constructor(params: {
        email: string;
        name: string;
        age: number;
      }) {}
    }
  `);

  const result = parseFreezedClasses(project.getSourceFile('test.ts')!);
  expect(result.classes[0].hasDefaults).toBe(false);
  expect(result.classes[0].hasAsserts).toBe(true);
  expect(result.classes[0].properties).toEqual([
    { name: 'email', type: 'string', optional: false, hasDefault: false, hasAssert: true, hasMessage: true, isFreezed: false },
    { name: 'name', type: 'string', optional: false, hasDefault: false, hasAssert: true, hasMessage: false, isFreezed: false },
    { name: 'age', type: 'number', optional: false, hasDefault: false, hasAssert: false, hasMessage: false, isFreezed: false },
  ]);
});
```

- [ ] **Step 7: Run parser tests**

Run: `bun test src/generator/parser.test.ts`
Expected: All tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/generator/parser.ts src/generator/parser.test.ts
git commit -m "refactor: replace hasFieldConfig with hasDefaults/hasAsserts and per-property flags"
```

---

### Task 2: Emitter — unrolled field config blocks

**Files:**
- Modify: `src/generator/emitter.ts`
- Modify: `src/generator/emitter.test.ts`

- [ ] **Step 1: Update emitClassBody to use new flags**

In `src/generator/emitter.ts`, in the `emitClassBody` function (line 153), replace the `paramsVar` and `fieldConfigBlock` lines:

```typescript
// old
  const paramsVar = cls.hasFieldConfig ? 'resolved' : 'params';

  const fieldConfigBlock = cls.hasFieldConfig
    ? emitFieldConfigBlock(cls)
    : '';
// new
  const hasFieldConfig = cls.hasDefaults || cls.hasAsserts;
  const paramsVar = hasFieldConfig ? 'resolved' : 'params';

  const fieldConfigBlock = hasFieldConfig
    ? emitFieldConfigBlock(cls)
    : '';
```

- [ ] **Step 2: Replace emitFieldConfigBlock with unrolled per-field code**

Replace the entire `emitFieldConfigBlock` function (lines 194-209):

```typescript
function emitFieldConfigBlock(cls: ParsedFreezedClass): string {
  const lines = [
    `    const __fields = (new.target as any)[Symbol.for('freezedts:options')]?.fields ?? {};`,
    `    const resolved = { ...params } as Required<${cls.className}Params>;`,
  ];

  for (const p of cls.properties) {
    if (p.hasDefault && p.hasAssert) {
      const errorExpr = p.hasMessage
        ? `__fields.${p.name}.message`
        : `\`Assertion failed for '\${new.target.name}.${p.name}'\``;
      lines.push(`    if ((resolved as any).${p.name} === undefined) {`);
      lines.push(`      (resolved as any).${p.name} = __fields.${p.name}.default;`);
      lines.push(`    } else if (!__fields.${p.name}.assert((resolved as any).${p.name})) {`);
      lines.push(`      throw new Error(${errorExpr});`);
      lines.push(`    }`);
    } else if (p.hasDefault) {
      lines.push(`    if ((resolved as any).${p.name} === undefined) {`);
      lines.push(`      (resolved as any).${p.name} = __fields.${p.name}.default;`);
      lines.push(`    }`);
    } else if (p.hasAssert) {
      const errorExpr = p.hasMessage
        ? `__fields.${p.name}.message`
        : `\`Assertion failed for '\${new.target.name}.${p.name}'\``;
      lines.push(`    if (!__fields.${p.name}.assert((resolved as any).${p.name})) {`);
      lines.push(`      throw new Error(${errorExpr});`);
      lines.push(`    }`);
    }
  }

  return lines.join('\n') + '\n';
}
```

- [ ] **Step 3: Update emitter tests — interface changes**

In `src/generator/emitter.test.ts`, apply these bulk changes:

**A.** Replace all `hasFieldConfig: false` with `hasDefaults: false, hasAsserts: false` throughout the file.

**B.** Replace all `hasFieldConfig: true` with `hasDefaults: true, hasAsserts: false` (the existing field-config tests only have defaults).

**C.** Add `hasAssert: false, hasMessage: false,` to every `ParsedProperty` object in the file. These go after `hasDefault: false,` or `hasDefault: true,`.

- [ ] **Step 4: Rewrite the 'generates field config processing block' test**

Replace the test at line 180 with:

```typescript
it('generates per-field default blocks when hasDefaults is true', () => {
  const classes: ParsedFreezedClass[] = [
    {
      className: 'Counter',
      generatedClassName: '$Counter',
      hasDefaults: true,
      hasAsserts: false,
      equalityMode: 'deep',
      properties: [
        { name: 'name', type: 'string', optional: false, hasDefault: false, hasAssert: false, hasMessage: false, isFreezed: false },
        { name: 'count', type: 'number', optional: false, hasDefault: true, hasAssert: false, hasMessage: false, isFreezed: false },
      ],
    },
  ];

  const output = emitFreezedFile(classes);
  expect(output).toContain("Symbol.for('freezedts:options')");
  expect(output).toContain('const resolved = { ...params } as Required<CounterParams>;');
  // Per-field default block, no generic loop
  expect(output).toContain('(resolved as any).count === undefined');
  expect(output).toContain('__fields.count.default');
  // No assert code emitted
  expect(output).not.toContain('.assert');
  // No generic loop
  expect(output).not.toContain('Object.entries');
  expect(output).toContain('this.name = resolved.name;');
  expect(output).toContain('this.count = resolved.count;');
});
```

- [ ] **Step 5: Add test for assert-only field config**

```typescript
it('generates per-field assert blocks when hasAsserts is true', () => {
  const classes: ParsedFreezedClass[] = [
    {
      className: 'Email',
      generatedClassName: '$Email',
      hasDefaults: false,
      hasAsserts: true,
      equalityMode: 'deep',
      properties: [
        { name: 'address', type: 'string', optional: false, hasDefault: false, hasAssert: true, hasMessage: true, isFreezed: false },
        { name: 'subject', type: 'string', optional: false, hasDefault: false, hasAssert: true, hasMessage: false, isFreezed: false },
        { name: 'body', type: 'string', optional: false, hasDefault: false, hasAssert: false, hasMessage: false, isFreezed: false },
      ],
    },
  ];

  const output = emitFreezedFile(classes);
  // Assert with custom message — uses __fields.address.message directly
  expect(output).toContain('__fields.address.assert((resolved as any).address)');
  expect(output).toContain('__fields.address.message');
  // Assert without message — uses template literal fallback
  expect(output).toContain('__fields.subject.assert((resolved as any).subject)');
  expect(output).toContain("Assertion failed for");
  // No default code
  expect(output).not.toContain('.default');
  // body has no assert — no block for it
  expect(output).not.toContain('__fields.body');
});
```

- [ ] **Step 6: Add test for both default+assert (if/else if)**

```typescript
it('generates if/else-if block when property has both default and assert', () => {
  const classes: ParsedFreezedClass[] = [
    {
      className: 'Config',
      generatedClassName: '$Config',
      hasDefaults: true,
      hasAsserts: true,
      equalityMode: 'deep',
      properties: [
        { name: 'port', type: 'number', optional: false, hasDefault: true, hasAssert: true, hasMessage: true, isFreezed: false },
      ],
    },
  ];

  const output = emitFreezedFile(classes);
  // if/else if pattern: default branch, then assert branch
  expect(output).toContain('(resolved as any).port === undefined');
  expect(output).toContain('__fields.port.default');
  expect(output).toContain('} else if (!__fields.port.assert');
  expect(output).toContain('__fields.port.message');
});
```

- [ ] **Step 7: Fix the 'uses __freezedDeepFreeze with resolved params' test**

The test at line 445 has `hasFieldConfig: true` but NO property with `hasDefault: true`. After the refactor, `hasDefaults` would be false so `resolved` won't exist. Fix by adding a property with a default:

```typescript
it('uses __freezedDeepFreeze with resolved params when hasDefaults', () => {
  const classes: ParsedFreezedClass[] = [
    {
      className: 'Config',
      generatedClassName: '$Config',
      hasDefaults: true,
      hasAsserts: false,
      equalityMode: 'deep',
      properties: [
        { name: 'count', type: 'number', optional: false, hasDefault: true, hasAssert: false, hasMessage: false, isFreezed: false },
        { name: 'items', type: 'string[]', optional: false, hasDefault: false, hasAssert: false, hasMessage: false, isFreezed: false },
      ],
    },
  ];
  const output = emitFreezedFile(classes);
  expect(output).toContain('this.items = __freezedDeepFreeze(resolved.items)');
});
```

- [ ] **Step 8: Update the 'omits processing block when hasFieldConfig is false' test**

This test at line 203 checks `hasFieldConfig: false`. Update its class construction to use `hasDefaults: false, hasAsserts: false` (already done in step 3). The assertion `expect(output).not.toContain('resolved')` stays unchanged.

- [ ] **Step 9: Run emitter tests**

Run: `bun test src/generator/emitter.test.ts`
Expected: All tests pass.

- [ ] **Step 10: Regenerate fixtures and run full suite**

```bash
find tests -name '*.ts' ! -name '*.freezed.ts' ! -name '*.test.ts' -exec touch {} +
bun src/cli.ts tests
bun test
```

Expected: All tests pass, including integration tests for field config (defaults, assertions, mixed).

- [ ] **Step 11: Commit**

```bash
git add src/generator/emitter.ts src/generator/emitter.test.ts tests/
git commit -m "refactor: unroll field config loop into per-field if-blocks"
```

---

### Task 3: Conditional `__freezedDeepFreeze` emission

**Files:**
- Modify: `src/generator/emitter.ts`
- Modify: `src/generator/emitter.test.ts`

- [ ] **Step 1: Write the failing test — deepFreeze omitted for all-primitive classes**

Add to `src/generator/emitter.test.ts`:

```typescript
it('omits __freezedDeepFreeze when all properties are primitive types', () => {
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
  expect(output).not.toContain('__freezedDeepFreeze');
});
```

- [ ] **Step 2: Write test — deepFreeze omitted for optional primitives (| undefined stripped)**

```typescript
it('omits __freezedDeepFreeze when optional primitives have | undefined suffix', () => {
  const classes: ParsedFreezedClass[] = [
    {
      className: 'Counter',
      generatedClassName: '$Counter',
      hasDefaults: true,
      hasAsserts: false,
      equalityMode: 'deep',
      properties: [
        { name: 'name', type: 'string', optional: false, hasDefault: false, hasAssert: false, hasMessage: false, isFreezed: false },
        { name: 'count', type: 'number | undefined', optional: true, hasDefault: true, hasAssert: false, hasMessage: false, isFreezed: false },
      ],
    },
  ];
  const output = emitFreezedFile(classes);
  expect(output).not.toContain('__freezedDeepFreeze');
  // count assignment should be plain (not wrapped)
  expect(output).toContain('this.count = resolved.count;');
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `bun test src/generator/emitter.test.ts`
Expected: Both new tests FAIL — `__freezedDeepFreeze` is currently always emitted.

- [ ] **Step 4: Update the PRIMITIVE_TYPES check to strip | undefined**

In `src/generator/emitter.ts`, replace the assignment block in `emitClassBody` (the `assignments` const):

```typescript
// old
  const assignments = cls.properties
    .map((p) => {
      if (PRIMITIVE_TYPES.has(p.type)) {
        return `    this.${p.name} = ${paramsVar}.${p.name};`;
      }
      return `    this.${p.name} = __freezedDeepFreeze(${paramsVar}.${p.name});`;
    })
    .join('\n');
// new
  const assignments = cls.properties
    .map((p) => {
      const baseType = p.type.replace(/\s*\|\s*undefined$/, '').trim();
      if (PRIMITIVE_TYPES.has(baseType)) {
        return `    this.${p.name} = ${paramsVar}.${p.name};`;
      }
      return `    this.${p.name} = __freezedDeepFreeze(${paramsVar}.${p.name});`;
    })
    .join('\n');
```

- [ ] **Step 5: Make __freezedDeepFreeze emission conditional**

In `emitFreezedFile` (top of the file), replace the unconditional push:

```typescript
// old
  helpers.push(emitDeepFreezeHelper());
// new
  const needsFreeze = classes.some(c =>
    c.properties.some(p => {
      const baseType = p.type.replace(/\s*\|\s*undefined$/, '').trim();
      return !PRIMITIVE_TYPES.has(baseType);
    })
  );
  if (needsFreeze) helpers.push(emitDeepFreezeHelper());
```

- [ ] **Step 6: Update existing test that asserts deepFreeze is always present**

The test 'omits both with() and equals() when both disabled' (line 608) asserts `expect(output).toContain('__freezedDeepFreeze')`. This class has only `name: string` which is primitive, so deepFreeze will now be omitted. Update:

```typescript
// old
    expect(output).toContain('__freezedDeepFreeze');
// new
    // __freezedDeepFreeze is omitted for all-primitive classes
    expect(output).not.toContain('__freezedDeepFreeze');
```

- [ ] **Step 7: Run emitter tests**

Run: `bun test src/generator/emitter.test.ts`
Expected: All tests pass.

- [ ] **Step 8: Regenerate fixtures and run full suite**

```bash
find tests -name '*.ts' ! -name '*.freezed.ts' ! -name '*.test.ts' -exec touch {} +
bun src/cli.ts tests
bun test
```

Expected: All tests pass.

- [ ] **Step 9: Commit**

```bash
git add src/generator/emitter.ts src/generator/emitter.test.ts tests/
git commit -m "perf: conditionally emit __freezedDeepFreeze, strip | undefined in primitive check"
```

---

### Task 4: Generator — build-time default validation

**Files:**
- Modify: `src/generator/generator.ts`
- Test: `src/generator/generator.test.ts`

- [ ] **Step 1: Write the failing generator test**

Add to `src/generator/generator.test.ts`:

```typescript
it('reports error when default value fails its assertion', async () => {
  await withTempDir((dir) => {
    const sourceFile = path.join(dir, 'bad-default.ts');
    fs.writeFileSync(
      sourceFile,
      `
      import { freezed } from 'freezedts';

      @freezed({
        fields: {
          port: {
            default: -1,
            assert: (v: number) => v > 0 && v < 65536,
            message: 'port out of range',
          },
        },
      })
      class Config {
        constructor(params: { name: string; port?: number }) {}
      }
    `,
    );

    const result = generate([sourceFile]);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('Config');
    expect(result.errors[0]).toContain('port');
    expect(result.errors[0]).toContain('default');
  });
});

it('passes when default value satisfies assertion', async () => {
  await withTempDir((dir) => {
    const sourceFile = path.join(dir, 'good-default.ts');
    fs.writeFileSync(
      sourceFile,
      `
      import { freezed } from 'freezedts';

      @freezed({
        fields: {
          port: {
            default: 3000,
            assert: (v: number) => v > 0 && v < 65536,
            message: 'port out of range',
          },
        },
      })
      class Config {
        constructor(params: { name: string; port?: number }) {}
      }
    `,
    );

    const result = generate([sourceFile]);
    expect(result.errors).toEqual([]);
  });
});

it('skips validation when default or assert uses external references', async () => {
  await withTempDir((dir) => {
    const sourceFile = path.join(dir, 'complex-default.ts');
    fs.writeFileSync(
      sourceFile,
      `
      import { freezed } from 'freezedts';

      const DEFAULT_PORT = 3000;

      @freezed({
        fields: {
          port: {
            default: DEFAULT_PORT,
            assert: (v: number) => v > 0,
          },
        },
      })
      class Config {
        constructor(params: { name: string; port?: number }) {}
      }
    `,
    );

    const result = generate([sourceFile]);
    // Should not error — validation skipped for non-literal references
    expect(result.errors).toEqual([]);
    expect(result.filesWritten).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/generator/generator.test.ts`
Expected: First test FAIL — no error reported for bad default.

- [ ] **Step 3: Add validation function to generator.ts**

Add a helper function before the `generate` function in `src/generator/generator.ts`:

```typescript
function validateDefaults(
  cls: ReturnType<typeof parseFreezedClasses>['classes'][0],
  sourceFile: import('ts-morph').SourceFile,
  project: Project,
): string[] {
  const errors: string[] = [];

  for (const prop of cls.properties) {
    if (!prop.hasDefault || !prop.hasAssert) continue;

    // Find the field config in the AST to extract default and assert text
    const classDecl = sourceFile.getClasses().find(c => c.getName() === cls.className);
    if (!classDecl) continue;

    const decorator = classDecl.getDecorators().find(d => d.getName() === 'freezed');
    if (!decorator) continue;

    const args = decorator.getArguments();
    if (args.length === 0) continue;

    const optionsArg = args[0];
    if (!Node.isObjectLiteralExpression(optionsArg)) continue;

    const fieldsProp = optionsArg.getProperty('fields');
    if (!fieldsProp || !Node.isPropertyAssignment(fieldsProp)) continue;

    const fieldsInit = fieldsProp.getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);
    if (!fieldsInit) continue;

    const fieldProp = fieldsInit.getProperty(prop.name);
    if (!fieldProp || !Node.isPropertyAssignment(fieldProp)) continue;

    const fieldInit = fieldProp.getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);
    if (!fieldInit) continue;

    const defaultProp = fieldInit.getProperty('default');
    const assertProp = fieldInit.getProperty('assert');
    if (!defaultProp || !assertProp) continue;
    if (!Node.isPropertyAssignment(defaultProp) || !Node.isPropertyAssignment(assertProp)) continue;

    const defaultInit = defaultProp.getInitializer();
    const assertInit = assertProp.getInitializer();
    if (!defaultInit || !assertInit) continue;

    const defaultText = defaultInit.getText();
    const assertText = assertInit.getText();

    // Transpile TypeScript to JavaScript and eval
    const testExpr = `(${assertText})(${defaultText})`;
    try {
      const tmpFile = project.createSourceFile('__validate_default.ts', `export default ${testExpr};\n`);
      const emitOutput = tmpFile.getEmitOutput();
      project.removeSourceFile(tmpFile);
      const jsFiles = emitOutput.getOutputFiles();
      if (jsFiles.length === 0) continue;
      const js = jsFiles[0].getText();
      // Extract the default export value from the compiled JS
      const match = js.match(/export default (.+);/s);
      if (!match) continue;
      const result = eval(match[1]);
      if (result === false) {
        errors.push(`Default value for '${cls.className}.${prop.name}' fails its assertion`);
      }
    } catch {
      // Can't evaluate (external references, complex expressions) — skip silently
    }
  }

  return errors;
}
```

Add `import { Node, SyntaxKind } from 'ts-morph';` — but these are already available via the parser's types. Actually, the generator file doesn't import `Node` or `SyntaxKind`. Add them:

```typescript
// old
import { Project } from 'ts-morph';
// new
import { Project, Node, SyntaxKind } from 'ts-morph';
```

Also import `parseFreezedClasses` type for the function signature — it's already imported.

- [ ] **Step 4: Call validateDefaults in Phase 1**

In the `generate` function, inside the Phase 1 loop, after parsing succeeds but before the `if (classes.length > 0)` check, add validation:

```typescript
// old
      if (classes.length > 0) {
        parsed.set(filePath, { absolutePath, classes });
      }
// new
      for (const cls of classes) {
        const validationErrors = validateDefaults(cls, sourceFile, project);
        errors.push(...validationErrors.map(e => `${filePath}: ${e}`));
      }
      if (classes.length > 0) {
        parsed.set(filePath, { absolutePath, classes });
      }
```

- [ ] **Step 5: Run tests**

Run: `bun test src/generator/generator.test.ts`
Expected: All tests pass, including the three new validation tests.

- [ ] **Step 6: Run full suite**

Run: `bun test`
Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/generator/generator.ts src/generator/generator.test.ts
git commit -m "feat: validate default values against assertions at generation time"
```
