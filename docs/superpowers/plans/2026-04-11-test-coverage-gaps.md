# Test Coverage Gap Remediation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add ~110 new test cases across 22 test suites to close coverage gaps around imported types, generic types, and runtime behavior.

**Architecture:** Each test suite is independent. Tasks add runtime behavior tests to codegen-only suites (Category A), imported-type fixtures+tests to primitive-only suites (Category B), and targeted additions to undertested suites (Category C). No generator code changes — tests only.

**Tech Stack:** TypeScript, bun:test, freezedts code generator

**Conventions:**
- Test framework: `bun:test` (`describe`, `it`, `expect`, `beforeAll`)
- Generator: `generate()` from `../../packages/freezedts-cli/src/generator/generator.js`
- Runtime imports: `await import('./fixtures/file.ts')` for class instantiation
- Codegen checks: `fs.readFileSync()` + `expect().toContain()`
- Fixture decorator: `@freezed()` extending `$ClassName` from `.freezed.ts`
- Freezed import: `import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts'`
- External type imports use `import type`
- Generated imports use `.js` extensions

---

## Task 1: A1 — Generic Imports Runtime Tests

**Files:**
- Modify: `tests/generic-imports/generic-imports.test.ts`

No new fixtures needed. The Container class with Wrapper, Item, Pair, Tag, Box interfaces already exists.

- [ ] **Step 1: Add runtime test block to generic-imports.test.ts**

Append this `describe` block after the existing `describe('importing generic types', ...)` block:

```typescript
describe('generic imports -- runtime behavior', () => {
  it('constructs with generic interface values', async () => {
    const { Container } = await import('./fixtures/container.ts');
    const c = new Container({
      wrapped: { value: { id: 'i1', name: 'item1' }, label: 'w' },
      items: [{ value: { id: 'i2', name: 'item2' }, label: 'arr' }],
      pair: { first: { id: 'i3', name: 'x' }, second: { key: 'k', value: 'v' } },
      nested: { value: { content: { id: 'deep', name: 'nested' } }, label: 'n' },
      complex: { first: { content: { id: 'c1', name: 'boxed' } }, second: { key: 'ck', value: 'cv' } },
      label: 'test',
    });
    expect(c.wrapped.value.id).toBe('i1');
    expect(c.pair.first.name).toBe('x');
    expect(c.nested.value.content.id).toBe('deep');
  });

  it('instance is frozen', async () => {
    const { Container } = await import('./fixtures/container.ts');
    const c = new Container({
      wrapped: { value: { id: '1', name: 'a' }, label: 'w' },
      items: [],
      pair: { first: { id: '2', name: 'b' }, second: { key: 'k', value: 'v' } },
      nested: { value: { content: { id: '3', name: 'c' } }, label: 'n' },
      complex: { first: { content: { id: '4', name: 'd' } }, second: { key: 'k', value: 'v' } },
      label: 'test',
    });
    expect(Object.isFrozen(c)).toBe(true);
  });

  it('nested generic values are deep-frozen', async () => {
    const { Container } = await import('./fixtures/container.ts');
    const c = new Container({
      wrapped: { value: { id: '1', name: 'a' }, label: 'w' },
      items: [],
      pair: { first: { id: '2', name: 'b' }, second: { key: 'k', value: 'v' } },
      nested: { value: { content: { id: '3', name: 'c' } }, label: 'n' },
      complex: { first: { content: { id: '4', name: 'd' } }, second: { key: 'k', value: 'v' } },
      label: 'test',
    });
    expect(Object.isFrozen(c.wrapped)).toBe(true);
    expect(Object.isFrozen(c.pair)).toBe(true);
    expect(Object.isFrozen(c.nested)).toBe(true);
    expect(Object.isFrozen(c.nested.value)).toBe(true);
    expect(Object.isFrozen(c.nested.value.content)).toBe(true);
  });

  it('array of generic values is frozen', async () => {
    const { Container } = await import('./fixtures/container.ts');
    const c = new Container({
      wrapped: { value: { id: '1', name: 'a' }, label: 'w' },
      items: [{ value: { id: '2', name: 'b' }, label: 'x' }],
      pair: { first: { id: '3', name: 'c' }, second: { key: 'k', value: 'v' } },
      nested: { value: { content: { id: '4', name: 'd' } }, label: 'n' },
      complex: { first: { content: { id: '5', name: 'e' } }, second: { key: 'k', value: 'v' } },
      label: 'test',
    });
    expect(Object.isFrozen(c.items)).toBe(true);
    expect(() => (c.items as any[]).push({})).toThrow();
  });

  it('equals returns true for identical generic values', async () => {
    const { Container } = await import('./fixtures/container.ts');
    const params = {
      wrapped: { value: { id: '1', name: 'a' }, label: 'w' },
      items: [{ value: { id: '2', name: 'b' }, label: 'x' }],
      pair: { first: { id: '3', name: 'c' }, second: { key: 'k', value: 'v' } },
      nested: { value: { content: { id: '4', name: 'd' } }, label: 'n' },
      complex: { first: { content: { id: '5', name: 'e' } }, second: { key: 'k', value: 'v' } },
      label: 'test',
    };
    const a = new Container(params);
    const b = new Container(params);
    expect(a.equals(b)).toBe(true);
  });

  it('equals detects difference in nested generic', async () => {
    const { Container } = await import('./fixtures/container.ts');
    const base = {
      wrapped: { value: { id: '1', name: 'a' }, label: 'w' },
      items: [],
      pair: { first: { id: '2', name: 'b' }, second: { key: 'k', value: 'v' } },
      complex: { first: { content: { id: '4', name: 'd' } }, second: { key: 'k', value: 'v' } },
      label: 'test',
    };
    const a = new Container({ ...base, nested: { value: { content: { id: 'x', name: 'n' } }, label: 'n' } });
    const b = new Container({ ...base, nested: { value: { content: { id: 'y', name: 'n' } }, label: 'n' } });
    expect(a.equals(b)).toBe(false);
  });

  it('with() replaces a generic field', async () => {
    const { Container } = await import('./fixtures/container.ts');
    const c = new Container({
      wrapped: { value: { id: '1', name: 'a' }, label: 'w' },
      items: [],
      pair: { first: { id: '2', name: 'b' }, second: { key: 'k', value: 'v' } },
      nested: { value: { content: { id: '3', name: 'c' } }, label: 'n' },
      complex: { first: { content: { id: '4', name: 'd' } }, second: { key: 'k', value: 'v' } },
      label: 'old',
    });
    const c2 = c.with({ label: 'new' });
    expect(c2.label).toBe('new');
    expect(c.label).toBe('old');
    expect(c2).not.toBe(c);
  });

  it('toString includes generic field content', async () => {
    const { Container } = await import('./fixtures/container.ts');
    const c = new Container({
      wrapped: { value: { id: '1', name: 'a' }, label: 'w' },
      items: [],
      pair: { first: { id: '2', name: 'b' }, second: { key: 'k', value: 'v' } },
      nested: { value: { content: { id: '3', name: 'c' } }, label: 'n' },
      complex: { first: { content: { id: '4', name: 'd' } }, second: { key: 'k', value: 'v' } },
      label: 'test',
    });
    expect(c.toString()).toContain('Container(');
  });
});
```

- [ ] **Step 2: Run tests**

Run: `bun test tests/generic-imports/generic-imports.test.ts`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add tests/generic-imports/generic-imports.test.ts
git commit -m "test: add runtime behavior tests for generic imports"
```

---

## Task 2: A2 — Generic Class Imports Runtime Tests

**Files:**
- Modify: `tests/generic-class-imports/generic-class-imports.test.ts`

No new fixtures. Container uses Wrapper, Item, Pair, Box as classes (not interfaces).

- [ ] **Step 1: Add runtime test block**

Append this `describe` block:

```typescript
describe('generic class imports -- runtime behavior', () => {
  it('constructs with generic class instances', async () => {
    const { Container } = await import('./fixtures/container.ts');
    const { Wrapper } = await import('./fixtures/wrapper.ts');
    const { Item } = await import('./fixtures/item.ts');
    const { Pair } = await import('./fixtures/pair.ts');
    const { Box } = await import('./fixtures/box.ts');
    const c = new Container({
      wrapped: new Wrapper(new Item('1', 'a'), 'w'),
      items: [new Wrapper(new Item('2', 'b'), 'x')],
      pair: new Pair(new Item('3', 'c'), 'tag'),
      nested: new Wrapper(new Box(new Item('4', 'd')), 'n'),
      label: 'test',
    });
    expect(c.wrapped.value.id).toBe('1');
    expect(c.items[0].label).toBe('x');
    expect(c.pair.first.name).toBe('c');
    expect(c.nested.value.content.id).toBe('4');
  });

  it('instance and nested class instances are frozen', async () => {
    const { Container } = await import('./fixtures/container.ts');
    const { Wrapper } = await import('./fixtures/wrapper.ts');
    const { Item } = await import('./fixtures/item.ts');
    const { Pair } = await import('./fixtures/pair.ts');
    const { Box } = await import('./fixtures/box.ts');
    const c = new Container({
      wrapped: new Wrapper(new Item('1', 'a'), 'w'),
      items: [],
      pair: new Pair(new Item('2', 'b'), 'tag'),
      nested: new Wrapper(new Box(new Item('3', 'c')), 'n'),
      label: 'test',
    });
    expect(Object.isFrozen(c)).toBe(true);
    expect(Object.isFrozen(c.wrapped)).toBe(true);
    expect(Object.isFrozen(c.nested.value)).toBe(true);
  });

  it('equals returns true for structurally identical class instances', async () => {
    const { Container } = await import('./fixtures/container.ts');
    const { Wrapper } = await import('./fixtures/wrapper.ts');
    const { Item } = await import('./fixtures/item.ts');
    const { Pair } = await import('./fixtures/pair.ts');
    const { Box } = await import('./fixtures/box.ts');
    const mkContainer = () => new Container({
      wrapped: new Wrapper(new Item('1', 'a'), 'w'),
      items: [],
      pair: new Pair(new Item('2', 'b'), 'tag'),
      nested: new Wrapper(new Box(new Item('3', 'c')), 'n'),
      label: 'test',
    });
    expect(mkContainer().equals(mkContainer())).toBe(true);
  });

  it('equals detects class instance differences', async () => {
    const { Container } = await import('./fixtures/container.ts');
    const { Wrapper } = await import('./fixtures/wrapper.ts');
    const { Item } = await import('./fixtures/item.ts');
    const { Pair } = await import('./fixtures/pair.ts');
    const { Box } = await import('./fixtures/box.ts');
    const a = new Container({
      wrapped: new Wrapper(new Item('1', 'a'), 'w'),
      items: [],
      pair: new Pair(new Item('2', 'b'), 'tag'),
      nested: new Wrapper(new Box(new Item('3', 'c')), 'n'),
      label: 'test',
    });
    const b = new Container({
      wrapped: new Wrapper(new Item('1', 'CHANGED'), 'w'),
      items: [],
      pair: new Pair(new Item('2', 'b'), 'tag'),
      nested: new Wrapper(new Box(new Item('3', 'c')), 'n'),
      label: 'test',
    });
    expect(a.equals(b)).toBe(false);
  });

  it('with() replaces field and freezes result', async () => {
    const { Container } = await import('./fixtures/container.ts');
    const { Wrapper } = await import('./fixtures/wrapper.ts');
    const { Item } = await import('./fixtures/item.ts');
    const { Pair } = await import('./fixtures/pair.ts');
    const { Box } = await import('./fixtures/box.ts');
    const c = new Container({
      wrapped: new Wrapper(new Item('1', 'a'), 'w'),
      items: [],
      pair: new Pair(new Item('2', 'b'), 'tag'),
      nested: new Wrapper(new Box(new Item('3', 'c')), 'n'),
      label: 'old',
    });
    const c2 = c.with({ label: 'new' });
    expect(c2.label).toBe('new');
    expect(Object.isFrozen(c2)).toBe(true);
    expect(c2).not.toBe(c);
  });
});
```

- [ ] **Step 2: Run tests**

Run: `bun test tests/generic-class-imports/generic-class-imports.test.ts`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add tests/generic-class-imports/generic-class-imports.test.ts
git commit -m "test: add runtime behavior tests for generic class imports"
```

---

## Task 3: A3 — Transient Types Runtime Tests

**Files:**
- Modify: `tests/transient-types/transient-types.test.ts`

No new fixtures. Board has `feature: Feature` and `features: Feature[]` where Feature = BaseModel `{ id: string; name: string }`.

- [ ] **Step 1: Add runtime test block**

Append this `describe` block:

```typescript
describe('transient types -- runtime behavior', () => {
  it('constructs with transient type values', async () => {
    const { Board } = await import('./fixtures/board.ts');
    const b = new Board({
      feature: { id: '1', name: 'x' },
      features: [{ id: '2', name: 'y' }],
    });
    expect(b.feature.id).toBe('1');
    expect(b.features[0].name).toBe('y');
  });

  it('instance and feature values are frozen', async () => {
    const { Board } = await import('./fixtures/board.ts');
    const b = new Board({
      feature: { id: '1', name: 'x' },
      features: [{ id: '2', name: 'y' }],
    });
    expect(Object.isFrozen(b)).toBe(true);
    expect(Object.isFrozen(b.feature)).toBe(true);
    expect(Object.isFrozen(b.features)).toBe(true);
  });

  it('features array is frozen', async () => {
    const { Board } = await import('./fixtures/board.ts');
    const b = new Board({
      feature: { id: '1', name: 'x' },
      features: [{ id: '2', name: 'y' }],
    });
    expect(() => (b.features as any[]).push({ id: '3', name: 'z' })).toThrow();
  });

  it('equals works with transient types', async () => {
    const { Board } = await import('./fixtures/board.ts');
    const a = new Board({ feature: { id: '1', name: 'x' }, features: [] });
    const b = new Board({ feature: { id: '1', name: 'x' }, features: [] });
    expect(a.equals(b)).toBe(true);
    const c = new Board({ feature: { id: '2', name: 'y' }, features: [] });
    expect(a.equals(c)).toBe(false);
  });

  it('with() replaces feature field', async () => {
    const { Board } = await import('./fixtures/board.ts');
    const b = new Board({ feature: { id: '1', name: 'x' }, features: [] });
    const b2 = b.with({ feature: { id: '3', name: 'z' } });
    expect(b2.feature.id).toBe('3');
    expect(Object.isFrozen(b2)).toBe(true);
    expect(b.feature.id).toBe('1');
  });

  it('toString includes feature fields', async () => {
    const { Board } = await import('./fixtures/board.ts');
    const b = new Board({ feature: { id: '1', name: 'x' }, features: [] });
    expect(b.toString()).toContain('Board(');
  });
});
```

- [ ] **Step 2: Run tests**

Run: `bun test tests/transient-types/transient-types.test.ts`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add tests/transient-types/transient-types.test.ts
git commit -m "test: add runtime behavior tests for transient types"
```

---

## Task 4: A4 — Type Variants Runtime Tests

**Files:**
- Modify: `tests/type-variants/type-variants.test.ts`

No new fixtures. Uses: Pigment (plain class with `{ name, opacity }`), Shade/Finish (const-object enums), Stroke (@freezed: `{ width, pigments: Pigment[], shade: Shade }`), Canvas (@freezed: `{ title, finish, strokes: Stroke[], layers: Pigment[], highlight: Stroke | null }`).

- [ ] **Step 1: Add runtime test block**

Append this `describe` block:

```typescript
describe('type variants -- runtime behavior', () => {
  it('constructs Stroke with plain class and const-enum', async () => {
    const { Stroke } = await import('./fixtures/canvas.ts');
    const { Pigment } = await import('./fixtures/pigment.ts');
    const s = new Stroke({
      width: 2,
      pigments: [new Pigment({ name: 'red', opacity: 0.8 })],
      shade: 'DARK',
    });
    expect(s.width).toBe(2);
    expect(s.pigments[0].name).toBe('red');
    expect(s.shade).toBe('DARK');
  });

  it('constructs Canvas with all type variants', async () => {
    const { Stroke, Canvas } = await import('./fixtures/canvas.ts');
    const { Pigment } = await import('./fixtures/pigment.ts');
    const stroke = new Stroke({
      width: 1,
      pigments: [new Pigment({ name: 'blue', opacity: 1.0 })],
      shade: 'LIGHT',
    });
    const canvas = new Canvas({
      title: 'art',
      finish: 'MATTE',
      strokes: [stroke],
      layers: [new Pigment({ name: 'white', opacity: 0.5 })],
      highlight: null,
    });
    expect(canvas.title).toBe('art');
    expect(canvas.finish).toBe('MATTE');
    expect(canvas.highlight).toBeNull();
  });

  it('constructs Canvas with non-null highlight', async () => {
    const { Stroke, Canvas } = await import('./fixtures/canvas.ts');
    const { Pigment } = await import('./fixtures/pigment.ts');
    const stroke = new Stroke({
      width: 3,
      pigments: [new Pigment({ name: 'gold', opacity: 1.0 })],
      shade: 'MEDIUM',
    });
    const canvas = new Canvas({
      title: 'highlight test',
      finish: 'GLOSSY',
      strokes: [],
      layers: [],
      highlight: stroke,
    });
    expect(canvas.highlight).not.toBeNull();
    expect(canvas.highlight!.width).toBe(3);
  });

  it('Pigment instances inside arrays are frozen', async () => {
    const { Stroke } = await import('./fixtures/canvas.ts');
    const { Pigment } = await import('./fixtures/pigment.ts');
    const s = new Stroke({
      width: 1,
      pigments: [new Pigment({ name: 'red', opacity: 0.5 })],
      shade: 'DARK',
    });
    expect(Object.isFrozen(s.pigments[0])).toBe(true);
  });

  it('Stroke array inside Canvas is frozen', async () => {
    const { Stroke, Canvas } = await import('./fixtures/canvas.ts');
    const { Pigment } = await import('./fixtures/pigment.ts');
    const stroke = new Stroke({
      width: 1,
      pigments: [new Pigment({ name: 'blue', opacity: 1.0 })],
      shade: 'LIGHT',
    });
    const canvas = new Canvas({
      title: 'test',
      finish: 'MATTE',
      strokes: [stroke],
      layers: [],
      highlight: null,
    });
    expect(Object.isFrozen(canvas.strokes)).toBe(true);
    expect(Object.isFrozen(canvas.strokes[0])).toBe(true);
  });

  it('equals works with plain class array elements', async () => {
    const { Stroke } = await import('./fixtures/canvas.ts');
    const { Pigment } = await import('./fixtures/pigment.ts');
    const a = new Stroke({
      width: 1,
      pigments: [new Pigment({ name: 'red', opacity: 0.5 })],
      shade: 'DARK',
    });
    const b = new Stroke({
      width: 1,
      pigments: [new Pigment({ name: 'red', opacity: 0.5 })],
      shade: 'DARK',
    });
    expect(a.equals(b)).toBe(true);
  });

  it('equals detects Pigment differences', async () => {
    const { Stroke } = await import('./fixtures/canvas.ts');
    const { Pigment } = await import('./fixtures/pigment.ts');
    const a = new Stroke({
      width: 1,
      pigments: [new Pigment({ name: 'red', opacity: 0.5 })],
      shade: 'DARK',
    });
    const b = new Stroke({
      width: 1,
      pigments: [new Pigment({ name: 'red', opacity: 0.9 })],
      shade: 'DARK',
    });
    expect(a.equals(b)).toBe(false);
  });

  it('equals handles nullable Stroke (highlight)', async () => {
    const { Stroke, Canvas } = await import('./fixtures/canvas.ts');
    const { Pigment } = await import('./fixtures/pigment.ts');
    const stroke = new Stroke({
      width: 1,
      pigments: [new Pigment({ name: 'blue', opacity: 1.0 })],
      shade: 'LIGHT',
    });
    const a = new Canvas({
      title: 'test', finish: 'MATTE', strokes: [], layers: [], highlight: null,
    });
    const b = new Canvas({
      title: 'test', finish: 'MATTE', strokes: [], layers: [], highlight: stroke,
    });
    expect(a.equals(b)).toBe(false);
  });

  it('with() on Canvas replaces title', async () => {
    const { Stroke, Canvas } = await import('./fixtures/canvas.ts');
    const { Pigment } = await import('./fixtures/pigment.ts');
    const stroke = new Stroke({
      width: 1,
      pigments: [new Pigment({ name: 'blue', opacity: 1.0 })],
      shade: 'LIGHT',
    });
    const canvas = new Canvas({
      title: 'old', finish: 'MATTE', strokes: [stroke], layers: [], highlight: null,
    });
    const c2 = canvas.with({ title: 'new' });
    expect(c2.title).toBe('new');
    expect(c2.finish).toBe('MATTE');
    expect(c2.strokes).toEqual(canvas.strokes);
  });

  it('with() on Canvas replaces strokes', async () => {
    const { Stroke, Canvas } = await import('./fixtures/canvas.ts');
    const { Pigment } = await import('./fixtures/pigment.ts');
    const canvas = new Canvas({
      title: 'test', finish: 'SATIN', strokes: [], layers: [], highlight: null,
    });
    const newStroke = new Stroke({
      width: 5,
      pigments: [new Pigment({ name: 'green', opacity: 0.7 })],
      shade: 'MEDIUM',
    });
    const c2 = canvas.with({ strokes: [newStroke] });
    expect(c2.strokes).toHaveLength(1);
    expect(c2.strokes[0].width).toBe(5);
  });

  it('toString includes enum and class values', async () => {
    const { Stroke } = await import('./fixtures/canvas.ts');
    const { Pigment } = await import('./fixtures/pigment.ts');
    const s = new Stroke({
      width: 2,
      pigments: [new Pigment({ name: 'red', opacity: 0.8 })],
      shade: 'DARK',
    });
    expect(s.toString()).toContain('Stroke(');
  });
});
```

- [ ] **Step 2: Run tests**

Run: `bun test tests/type-variants/type-variants.test.ts`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add tests/type-variants/type-variants.test.ts
git commit -m "test: add runtime behavior tests for type variants"
```

---

## Task 5: A5 — Multi-Import Runtime Tests

**Files:**
- Modify: `tests/multi-import/multi-import.test.ts`

No new fixtures. Uses: Cat (empty class), Dog (empty class), PreferredSize (const-enum), Person (@freezed: `{ preferredSize, cat, dog }`).

- [ ] **Step 1: Add runtime test block**

Append this `describe` block:

```typescript
describe('multi-import -- runtime behavior', () => {
  it('constructs Person with class and enum values', async () => {
    const { Cat, Dog } = await import('./fixtures/animal.ts');
    const { Person } = await import('./fixtures/person.ts');
    const p = new Person({
      preferredSize: 'M',
      cat: new Cat(),
      dog: new Dog(),
    });
    expect(p.preferredSize).toBe('M');
  });

  it('instance and class fields are frozen', async () => {
    const { Cat, Dog } = await import('./fixtures/animal.ts');
    const { Person } = await import('./fixtures/person.ts');
    const p = new Person({
      preferredSize: 'S',
      cat: new Cat(),
      dog: new Dog(),
    });
    expect(Object.isFrozen(p)).toBe(true);
    expect(Object.isFrozen(p.cat)).toBe(true);
    expect(Object.isFrozen(p.dog)).toBe(true);
  });

  it('equals works with class-typed fields', async () => {
    const { Cat, Dog } = await import('./fixtures/animal.ts');
    const { Person } = await import('./fixtures/person.ts');
    const cat = new Cat();
    const dog = new Dog();
    const a = new Person({ preferredSize: 'L', cat, dog });
    const b = new Person({ preferredSize: 'L', cat, dog });
    expect(a.equals(b)).toBe(true);
  });

  it('equals detects class field differences', async () => {
    const { Cat, Dog } = await import('./fixtures/animal.ts');
    const { Person } = await import('./fixtures/person.ts');
    const a = new Person({ preferredSize: 'M', cat: new Cat(), dog: new Dog() });
    const b = new Person({ preferredSize: 'XL', cat: new Cat(), dog: new Dog() });
    expect(a.equals(b)).toBe(false);
  });

  it('with() replaces a class-typed field', async () => {
    const { Cat, Dog } = await import('./fixtures/animal.ts');
    const { Person } = await import('./fixtures/person.ts');
    const origCat = new Cat();
    const p = new Person({ preferredSize: 'M', cat: origCat, dog: new Dog() });
    const newCat = new Cat();
    const p2 = p.with({ cat: newCat });
    expect(p2.cat).toBe(newCat);
    expect(p.cat).toBe(origCat);
  });

  it('toString includes class field representations', async () => {
    const { Cat, Dog } = await import('./fixtures/animal.ts');
    const { Person } = await import('./fixtures/person.ts');
    const p = new Person({ preferredSize: 'M', cat: new Cat(), dog: new Dog() });
    expect(p.toString()).toContain('Person(');
  });
});
```

- [ ] **Step 2: Run tests**

Run: `bun test tests/multi-import/multi-import.test.ts`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add tests/multi-import/multi-import.test.ts
git commit -m "test: add runtime behavior tests for multi-import"
```

---

## Task 6: A6 — Circular Dependencies Runtime Tests

**Files:**
- Modify: `tests/circular-dependencies/fixtures/person.ts`
- Modify: `tests/circular-dependencies/fixtures/animal.ts`
- Modify: `tests/circular-dependencies/circular-dependencies.test.ts`

**Constraint:** The current fixtures are purely circular (`Person { pet: Animal }`, `Animal { owner: Person }`) with no base case — neither can be constructed. We must add primitive fields and make circular refs nullable.

- [ ] **Step 1: Update person.ts fixture**

Replace the constructor params to add a primitive and make pet nullable:

```typescript
import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import { Animal } from './animal.ts';
import { $Person } from './person.freezed.ts';

@freezed()
class Person extends $Person {
  constructor(params: { name: string; pet: Animal | null }) {
    super(params);
  }
}

export { Person };
```

- [ ] **Step 2: Update animal.ts fixture**

Replace the constructor params:

```typescript
import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import { Person } from './person.ts';
import { $Animal } from './animal.freezed.ts';

@freezed()
class Animal extends $Animal {
  constructor(params: { species: string; owner: Person | null }) {
    super(params);
  }
}

export { Animal };
```

- [ ] **Step 3: Update existing codegen tests**

The existing tests check for `pet: Animal;` and `owner: Person;`. Update to match nullable types:

In `circular-dependencies.test.ts`, replace:
- `expect(generated).toContain("pet: Animal;")` → `expect(generated).toContain("pet: Animal | null;")`
- `expect(generated).toContain("owner: Person;")` → `expect(generated).toContain("owner: Person | null;")`

- [ ] **Step 4: Add runtime test block**

Append:

```typescript
describe('circular dependencies -- runtime behavior', () => {
  it('constructs with circular references (chain, not true cycle)', async () => {
    const { Person } = await import('./fixtures/person.ts');
    const { Animal } = await import('./fixtures/animal.ts');
    const owner = new Person({ name: 'Alice', pet: null });
    const pet = new Animal({ species: 'Cat', owner });
    const person = new Person({ name: 'Bob', pet });
    expect(person.name).toBe('Bob');
    expect(person.pet!.species).toBe('Cat');
    expect(person.pet!.owner!.name).toBe('Alice');
  });

  it('frozen circular instances', async () => {
    const { Person } = await import('./fixtures/person.ts');
    const { Animal } = await import('./fixtures/animal.ts');
    const owner = new Person({ name: 'Alice', pet: null });
    const pet = new Animal({ species: 'Dog', owner });
    expect(Object.isFrozen(owner)).toBe(true);
    expect(Object.isFrozen(pet)).toBe(true);
  });

  it('equals on circular instances', async () => {
    const { Person } = await import('./fixtures/person.ts');
    const { Animal } = await import('./fixtures/animal.ts');
    const mkChain = () => {
      const o = new Person({ name: 'Alice', pet: null });
      const a = new Animal({ species: 'Cat', owner: o });
      return new Person({ name: 'Bob', pet: a });
    };
    expect(mkChain().equals(mkChain())).toBe(true);
  });

  it('toString on circular instance does not infinite-loop', async () => {
    const { Person } = await import('./fixtures/person.ts');
    const { Animal } = await import('./fixtures/animal.ts');
    const owner = new Person({ name: 'Alice', pet: null });
    const pet = new Animal({ species: 'Cat', owner });
    const person = new Person({ name: 'Bob', pet });
    expect(person.toString()).toContain('Person(');
  });
});
```

- [ ] **Step 5: Run tests**

Run: `bun test tests/circular-dependencies/circular-dependencies.test.ts`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add tests/circular-dependencies/fixtures/person.ts tests/circular-dependencies/fixtures/animal.ts tests/circular-dependencies/circular-dependencies.test.ts
git commit -m "test: add runtime behavior tests for circular dependencies"
```

---

## Task 7: B1 — Immutability with Imported Types

**Files:**
- Create: `tests/immutability/fixtures/coord.ts`
- Create: `tests/immutability/fixtures/with-import.ts`
- Modify: `tests/immutability/immutability.test.ts`

- [ ] **Step 1: Create coord.ts**

```typescript
export interface Coord {
  x: number;
  y: number;
}
```

- [ ] **Step 2: Create with-import.ts**

```typescript
import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import type { Coord } from './coord.ts';
import { $Locatable } from './with-import.freezed.ts';

@freezed()
class Locatable extends $Locatable {
  constructor(params: { label: string; position: Coord }) {
    super(params);
  }
}

export { Locatable };
```

- [ ] **Step 3: Add with-import.ts to generate() call in beforeAll**

In `immutability.test.ts`, add `path.join(fixturesDir, 'with-import.ts')` to the files array in `beforeAll`.

- [ ] **Step 4: Add test block**

```typescript
describe('immutability -- imported types', () => {
  it('creates instance with imported type field', async () => {
    const { Locatable } = await import('./fixtures/with-import.ts');
    const l = new Locatable({ label: 'a', position: { x: 1, y: 2 } });
    expect(l.position.x).toBe(1);
    expect(l.position.y).toBe(2);
  });

  it('instance is frozen', async () => {
    const { Locatable } = await import('./fixtures/with-import.ts');
    const l = new Locatable({ label: 'a', position: { x: 1, y: 2 } });
    expect(Object.isFrozen(l)).toBe(true);
  });

  it('imported type field value is deep-frozen', async () => {
    const { Locatable } = await import('./fixtures/with-import.ts');
    const l = new Locatable({ label: 'a', position: { x: 1, y: 2 } });
    expect(Object.isFrozen(l.position)).toBe(true);
  });

  it('mutating imported type field value throws', async () => {
    const { Locatable } = await import('./fixtures/with-import.ts');
    const l = new Locatable({ label: 'a', position: { x: 1, y: 2 } });
    expect(() => { (l.position as any).x = 99; }).toThrow();
  });

  it('reassigning imported type field throws', async () => {
    const { Locatable } = await import('./fixtures/with-import.ts');
    const l = new Locatable({ label: 'a', position: { x: 1, y: 2 } });
    expect(() => { (l as any).position = { x: 9, y: 9 }; }).toThrow();
  });
});
```

- [ ] **Step 5: Run tests**

Run: `bun test tests/immutability/immutability.test.ts`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add tests/immutability/fixtures/coord.ts tests/immutability/fixtures/with-import.ts tests/immutability/immutability.test.ts
git commit -m "test: add imported type tests for immutability"
```

---

## Task 8: B2 — Shallow Copy with Imported Types

**Files:**
- Create: `tests/shallow-copy/fixtures/coord.ts`
- Create: `tests/shallow-copy/fixtures/with-import.ts`
- Modify: `tests/shallow-copy/shallow-copy.test.ts`

- [ ] **Step 1: Create coord.ts**

```typescript
export interface Coord {
  x: number;
  y: number;
}
```

- [ ] **Step 2: Create with-import.ts**

```typescript
import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import type { Coord } from './coord.ts';
import { $Locatable } from './with-import.freezed.ts';

@freezed()
class Locatable extends $Locatable {
  constructor(params: { label: string; position: Coord }) {
    super(params);
  }
}

export { Locatable };
```

- [ ] **Step 3: Add with-import.ts to generate() call**

In `shallow-copy.test.ts`, add `path.join(fixturesDir, 'with-import.ts')` to the files array.

- [ ] **Step 4: Add test block**

```typescript
describe('shallow copy -- imported types', () => {
  it('with() replaces imported-type field', async () => {
    const { Locatable } = await import('./fixtures/with-import.ts');
    const l = new Locatable({ label: 'a', position: { x: 1, y: 2 } });
    const l2 = l.with({ position: { x: 9, y: 9 } });
    expect(l2.position).toEqual({ x: 9, y: 9 });
  });

  it('with() preserves imported-type field when not overridden', async () => {
    const { Locatable } = await import('./fixtures/with-import.ts');
    const l = new Locatable({ label: 'a', position: { x: 1, y: 2 } });
    const l2 = l.with({ label: 'new' });
    expect(l2.position).toEqual({ x: 1, y: 2 });
  });

  it('returned instance has frozen imported-type field', async () => {
    const { Locatable } = await import('./fixtures/with-import.ts');
    const l = new Locatable({ label: 'a', position: { x: 1, y: 2 } });
    const l2 = l.with({ position: { x: 9, y: 9 } });
    expect(Object.isFrozen(l2.position)).toBe(true);
  });

  it('with() on imported-type field produces a different instance', async () => {
    const { Locatable } = await import('./fixtures/with-import.ts');
    const l = new Locatable({ label: 'a', position: { x: 1, y: 2 } });
    const l2 = l.with({ position: { x: 9, y: 9 } });
    expect(l2).not.toBe(l);
  });

  it('original imported-type field is unchanged after with()', async () => {
    const { Locatable } = await import('./fixtures/with-import.ts');
    const l = new Locatable({ label: 'a', position: { x: 1, y: 2 } });
    l.with({ position: { x: 9, y: 9 } });
    expect(l.position.x).toBe(1);
  });
});
```

- [ ] **Step 5: Run tests**

Run: `bun test tests/shallow-copy/shallow-copy.test.ts`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add tests/shallow-copy/fixtures/coord.ts tests/shallow-copy/fixtures/with-import.ts tests/shallow-copy/shallow-copy.test.ts
git commit -m "test: add imported type tests for shallow copy"
```

---

## Task 9: B3 — Collections with Imported Type Elements

**Files:**
- Create: `tests/collections/fixtures/coord.ts`
- Create: `tests/collections/fixtures/imported-elements.ts`
- Modify: `tests/collections/collections.test.ts`

- [ ] **Step 1: Create coord.ts**

```typescript
export interface Coord {
  x: number;
  y: number;
}
```

- [ ] **Step 2: Create imported-elements.ts**

```typescript
import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import type { Coord } from './coord.ts';
import { $Path } from './imported-elements.freezed.ts';

@freezed()
class Path extends $Path {
  constructor(params: { name: string; points: Coord[]; lookup: Map<string, Coord> }) {
    super(params);
  }
}

export { Path };
```

- [ ] **Step 3: Add imported-elements.ts to generate() call**

In `collections.test.ts`, add `path.join(fixturesDir, 'imported-elements.ts')` to the files array.

- [ ] **Step 4: Add test block**

```typescript
describe('collections -- imported type elements', () => {
  it('constructs with array of imported types', async () => {
    const { Path } = await import('./fixtures/imported-elements.ts');
    const p = new Path({
      name: 'route',
      points: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
      lookup: new Map([['origin', { x: 0, y: 0 }]]),
    });
    expect(p.name).toBe('route');
    expect(p.points).toHaveLength(2);
  });

  it('array of imported types is frozen', async () => {
    const { Path } = await import('./fixtures/imported-elements.ts');
    const p = new Path({
      name: 'route',
      points: [{ x: 0, y: 0 }],
      lookup: new Map(),
    });
    expect(Object.isFrozen(p.points)).toBe(true);
    expect(() => (p.points as any[]).push({ x: 2, y: 2 })).toThrow();
  });

  it('individual imported-type elements in array are frozen', async () => {
    const { Path } = await import('./fixtures/imported-elements.ts');
    const p = new Path({
      name: 'route',
      points: [{ x: 0, y: 0 }],
      lookup: new Map(),
    });
    expect(Object.isFrozen(p.points[0])).toBe(true);
    expect(() => { (p.points[0] as any).x = 99; }).toThrow();
  });

  it('Map with imported-type values is frozen', async () => {
    const { Path } = await import('./fixtures/imported-elements.ts');
    const p = new Path({
      name: 'route',
      points: [],
      lookup: new Map([['origin', { x: 0, y: 0 }]]),
    });
    expect(Object.isFrozen(p.lookup)).toBe(true);
    expect(() => p.lookup.set('new', { x: 1, y: 1 })).toThrow();
  });

  it('Map values (imported type) are frozen', async () => {
    const { Path } = await import('./fixtures/imported-elements.ts');
    const p = new Path({
      name: 'route',
      points: [],
      lookup: new Map([['origin', { x: 0, y: 0 }]]),
    });
    expect(Object.isFrozen(p.lookup.get('origin'))).toBe(true);
  });

  it('equals works with imported-type collection elements', async () => {
    const { Path } = await import('./fixtures/imported-elements.ts');
    const a = new Path({ name: 'r', points: [{ x: 1, y: 2 }], lookup: new Map() });
    const b = new Path({ name: 'r', points: [{ x: 1, y: 2 }], lookup: new Map() });
    expect(a.equals(b)).toBe(true);
  });

  it('equals detects differences in imported-type elements', async () => {
    const { Path } = await import('./fixtures/imported-elements.ts');
    const a = new Path({ name: 'r', points: [{ x: 1, y: 2 }], lookup: new Map() });
    const b = new Path({ name: 'r', points: [{ x: 1, y: 9 }], lookup: new Map() });
    expect(a.equals(b)).toBe(false);
  });

  it('with() replaces array of imported types', async () => {
    const { Path } = await import('./fixtures/imported-elements.ts');
    const p = new Path({ name: 'r', points: [{ x: 1, y: 2 }], lookup: new Map() });
    const p2 = p.with({ points: [{ x: 5, y: 5 }] });
    expect(p2.points).toEqual([{ x: 5, y: 5 }]);
    expect(Object.isFrozen(p2.points)).toBe(true);
  });
});
```

- [ ] **Step 5: Run tests**

Run: `bun test tests/collections/collections.test.ts`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add tests/collections/fixtures/coord.ts tests/collections/fixtures/imported-elements.ts tests/collections/collections.test.ts
git commit -m "test: add imported type element tests for collections"
```

---

## Task 10: B4 — Config with Imported Types

**Files:**
- Create: `tests/config/fixtures/coord.ts`
- Create: `tests/config/fixtures/no-equal-imported.ts`
- Create: `tests/config/fixtures/no-copy-with-imported.ts`
- Modify: `tests/config/config.test.ts`

- [ ] **Step 1: Create coord.ts**

```typescript
export interface Coord {
  x: number;
  y: number;
}
```

- [ ] **Step 2: Create no-equal-imported.ts**

```typescript
import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import type { Coord } from './coord.ts';
import { $Pin } from './no-equal-imported.freezed.ts';

@freezed({ equal: false })
class Pin extends $Pin {
  constructor(params: { label: string; position: Coord }) {
    super(params);
  }
}

export { Pin };
```

- [ ] **Step 3: Create no-copy-with-imported.ts**

```typescript
import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import type { Coord } from './coord.ts';
import { $Marker } from './no-copy-with-imported.freezed.ts';

@freezed({ copyWith: false })
class Marker extends $Marker {
  constructor(params: { label: string; position: Coord }) {
    super(params);
  }
}

export { Marker };
```

- [ ] **Step 4: Add fixtures to generate() call**

In `config.test.ts`, add to the files array in `beforeAll`:
```typescript
path.join(fixturesDir, 'no-equal-imported.ts'),
path.join(fixturesDir, 'no-copy-with-imported.ts'),
```

- [ ] **Step 5: Add test block**

```typescript
describe('config -- imported type interaction', () => {
  it('equal:false still freezes imported-type fields', async () => {
    const { Pin } = await import('./fixtures/no-equal-imported.ts');
    const pin = new Pin({ label: 'a', position: { x: 1, y: 2 } });
    expect(Object.isFrozen(pin.position)).toBe(true);
  });

  it('equal:false -- no equals method with imported type', async () => {
    const { Pin } = await import('./fixtures/no-equal-imported.ts');
    const pin = new Pin({ label: 'a', position: { x: 1, y: 2 } });
    expect((pin as any).equals).toBeUndefined();
  });

  it('copyWith:false still freezes imported-type fields', async () => {
    const { Marker } = await import('./fixtures/no-copy-with-imported.ts');
    const marker = new Marker({ label: 'a', position: { x: 1, y: 2 } });
    expect(Object.isFrozen(marker.position)).toBe(true);
  });

  it('copyWith:false -- no with method with imported type', async () => {
    const { Marker } = await import('./fixtures/no-copy-with-imported.ts');
    const marker = new Marker({ label: 'a', position: { x: 1, y: 2 } });
    expect((marker as any).with).toBeUndefined();
  });

  it('generated file for imported type with equal:false omits equals but retains import', () => {
    const content = fs.readFileSync(
      path.join(fixturesDir, 'no-equal-imported.freezed.ts'), 'utf-8',
    );
    expect(content).toContain("import type { Coord }");
    expect(content).not.toContain('equals(other');
  });

  it('generated file for imported type with copyWith:false omits with but retains import', () => {
    const content = fs.readFileSync(
      path.join(fixturesDir, 'no-copy-with-imported.freezed.ts'), 'utf-8',
    );
    expect(content).toContain("import type { Coord }");
    expect(content).not.toContain('get with()');
  });
});
```

- [ ] **Step 6: Run tests**

Run: `bun test tests/config/config.test.ts`
Expected: All tests pass

- [ ] **Step 7: Commit**

```bash
git add tests/config/fixtures/coord.ts tests/config/fixtures/no-equal-imported.ts tests/config/fixtures/no-copy-with-imported.ts tests/config/config.test.ts
git commit -m "test: add imported type interaction tests for config"
```

---

## Task 11: B5 — Field Config with Imported Types

**Files:**
- Create: `tests/field-config/fixtures/coord.ts`
- Create: `tests/field-config/fixtures/with-import-defaults.ts`
- Create: `tests/field-config/fixtures/with-import-assertions.ts`
- Modify: `tests/field-config/field-config.test.ts`

- [ ] **Step 1: Create coord.ts**

```typescript
export interface Coord {
  x: number;
  y: number;
}
```

- [ ] **Step 2: Create with-import-defaults.ts**

```typescript
import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import type { Coord } from './coord.ts';
import { $Waypoint } from './with-import-defaults.freezed.ts';

@freezed({
  fields: {
    position: { default: { x: 0, y: 0 } },
  },
})
class Waypoint extends $Waypoint {
  constructor(params: { name: string; position?: Coord }) {
    super(params);
  }
}

export { Waypoint };
```

- [ ] **Step 3: Create with-import-assertions.ts**

```typescript
import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import type { Coord } from './coord.ts';
import { $Marker } from './with-import-assertions.freezed.ts';

@freezed({
  fields: {
    position: {
      assert: (v: Coord) => v.x >= 0 && v.y >= 0,
      message: 'position must be non-negative',
    },
  },
})
class Marker extends $Marker {
  constructor(params: { name: string; position: Coord }) {
    super(params);
  }
}

export { Marker };
```

- [ ] **Step 4: Add fixtures to generate() call**

In `field-config.test.ts`, add to the files array in `beforeAll`:
```typescript
path.join(fixturesDir, 'with-import-defaults.ts'),
path.join(fixturesDir, 'with-import-assertions.ts'),
```

- [ ] **Step 5: Add test blocks**

```typescript
describe('field config -- imported type defaults', () => {
  it('applies imported-type default when omitted', async () => {
    const { Waypoint } = await import('./fixtures/with-import-defaults.ts');
    const w = new Waypoint({ name: 'a' });
    expect(w.position).toEqual({ x: 0, y: 0 });
  });

  it('uses provided imported-type value over default', async () => {
    const { Waypoint } = await import('./fixtures/with-import-defaults.ts');
    const w = new Waypoint({ name: 'a', position: { x: 5, y: 5 } });
    expect(w.position).toEqual({ x: 5, y: 5 });
  });

  it('default imported-type value is frozen', async () => {
    const { Waypoint } = await import('./fixtures/with-import-defaults.ts');
    const w = new Waypoint({ name: 'a' });
    expect(Object.isFrozen(w.position)).toBe(true);
  });

  it('with({ position: undefined }) reapplies imported-type default', async () => {
    const { Waypoint } = await import('./fixtures/with-import-defaults.ts');
    const w = new Waypoint({ name: 'a', position: { x: 5, y: 5 } });
    const w2 = w.with({ position: undefined });
    expect(w2.position).toEqual({ x: 0, y: 0 });
  });
});

describe('field config -- imported type assertions', () => {
  it('allows construction with valid imported-type value', async () => {
    const { Marker } = await import('./fixtures/with-import-assertions.ts');
    const m = new Marker({ name: 'a', position: { x: 1, y: 1 } });
    expect(m.position).toEqual({ x: 1, y: 1 });
  });

  it('throws on invalid imported-type value', async () => {
    const { Marker } = await import('./fixtures/with-import-assertions.ts');
    expect(() => new Marker({ name: 'a', position: { x: -1, y: 0 } })).toThrow(
      'position must be non-negative',
    );
  });

  it('with() that violates imported-type assertion throws', async () => {
    const { Marker } = await import('./fixtures/with-import-assertions.ts');
    const m = new Marker({ name: 'a', position: { x: 1, y: 1 } });
    expect(() => m.with({ position: { x: -1, y: 0 } })).toThrow(
      'position must be non-negative',
    );
  });
});
```

- [ ] **Step 6: Run tests**

Run: `bun test tests/field-config/field-config.test.ts`
Expected: All tests pass

- [ ] **Step 7: Commit**

```bash
git add tests/field-config/fixtures/coord.ts tests/field-config/fixtures/with-import-defaults.ts tests/field-config/fixtures/with-import-assertions.ts tests/field-config/field-config.test.ts
git commit -m "test: add imported type tests for field config defaults and assertions"
```

---

## Task 12: B6 — Interface Params with Imported Type Fields

**Files:**
- Create: `tests/interface-params/fixtures/coord.ts`
- Create: `tests/interface-params/fixtures/with-complex-fields.ts`
- Modify: `tests/interface-params/interface-params.test.ts`

- [ ] **Step 1: Create coord.ts**

```typescript
export interface Coord {
  x: number;
  y: number;
}
```

- [ ] **Step 2: Create with-complex-fields.ts**

```typescript
import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import type { Coord } from './coord.ts';
import { $Marker } from './with-complex-fields.freezed.ts';

interface MarkerParams {
  label: string;
  position: Coord;
}

@freezed()
class Marker extends $Marker {
  constructor(params: MarkerParams) {
    super(params);
  }
}

export { Marker };
```

- [ ] **Step 3: Add fixture to generate() call**

In `interface-params.test.ts`, add to the files array in `beforeAll`:
```typescript
path.join(fixturesDir, 'with-complex-fields.ts'),
```

- [ ] **Step 4: Add test block**

```typescript
describe('interface params -- imported type fields', () => {
  it('works with interface containing imported type field', async () => {
    const { Marker } = await import('./fixtures/with-complex-fields.ts');
    const m = new Marker({ label: 'a', position: { x: 1, y: 2 } });
    expect(m.position.x).toBe(1);
  });

  it('imported type field is frozen', async () => {
    const { Marker } = await import('./fixtures/with-complex-fields.ts');
    const m = new Marker({ label: 'a', position: { x: 1, y: 2 } });
    expect(Object.isFrozen(m.position)).toBe(true);
  });

  it('with() replaces imported type field', async () => {
    const { Marker } = await import('./fixtures/with-complex-fields.ts');
    const m = new Marker({ label: 'a', position: { x: 1, y: 2 } });
    const m2 = m.with({ position: { x: 9, y: 9 } });
    expect(m2.position).toEqual({ x: 9, y: 9 });
    expect(m2).not.toBe(m);
  });

  it('equals() compares imported type fields deeply', async () => {
    const { Marker } = await import('./fixtures/with-complex-fields.ts');
    const a = new Marker({ label: 'a', position: { x: 1, y: 2 } });
    const b = new Marker({ label: 'a', position: { x: 1, y: 2 } });
    expect(a.equals(b)).toBe(true);
    const c = new Marker({ label: 'a', position: { x: 9, y: 9 } });
    expect(a.equals(c)).toBe(false);
  });

  it('generated file imports Coord', () => {
    const content = fs.readFileSync(
      path.join(fixturesDir, 'with-complex-fields.freezed.ts'), 'utf-8',
    );
    expect(content).toContain("import type { Coord }");
  });
});
```

Note: You will need to add `import * as fs from 'node:fs';` at the top of the test file if it's not already there.

- [ ] **Step 5: Run tests**

Run: `bun test tests/interface-params/interface-params.test.ts`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add tests/interface-params/fixtures/coord.ts tests/interface-params/fixtures/with-complex-fields.ts tests/interface-params/interface-params.test.ts
git commit -m "test: add imported type field tests for interface params"
```

---

## Task 13: C1+C8 — Import-Type and Transitive Dependencies Phone Tests

**Files:**
- Modify: `tests/import-type/import-type.test.ts`
- Modify: `tests/transitive-dependencies/transitive-dependencies.test.ts`

These two suites both use PhoneNumber as an imported non-freezed class. Adding targeted equality and runtime tests.

- [ ] **Step 1: Add tests to import-type.test.ts**

Add these test cases inside (or after) the existing `describe('importing types', ...)` block:

```typescript
  it('imported class field is frozen', async () => {
    const { PhoneNumber } = await import('./fixtures/phonenumber.ts');
    const { Person } = await import('./fixtures/person.ts');
    const person = new Person({
      name: 'Alice',
      tshirtSize: 'M',
      phone: new PhoneNumber({ areaCode: '415', phoneNumber: '5559999' }),
    });
    expect(Object.isFrozen(person.phone)).toBe(true);
  });

  it('with() replaces imported class field', async () => {
    const { PhoneNumber } = await import('./fixtures/phonenumber.ts');
    const { Person } = await import('./fixtures/person.ts');
    const origPhone = new PhoneNumber({ areaCode: '415', phoneNumber: '5559999' });
    const person = new Person({ name: 'Bob', tshirtSize: 'L', phone: origPhone });
    const p2 = person.with({ phone: new PhoneNumber({ areaCode: '555', phoneNumber: '1234' }) });
    expect(p2.phone.areaCode).toBe('555');
    expect(person.phone.areaCode).toBe('415');
  });

  it('equals detects imported class field difference', async () => {
    const { PhoneNumber } = await import('./fixtures/phonenumber.ts');
    const { Person } = await import('./fixtures/person.ts');
    const a = new Person({
      name: 'Dan', tshirtSize: 'XL',
      phone: new PhoneNumber({ areaCode: '303', phoneNumber: '5551111' }),
    });
    const b = new Person({
      name: 'Dan', tshirtSize: 'XL',
      phone: new PhoneNumber({ areaCode: '415', phoneNumber: '5551111' }),
    });
    expect(a.equals(b)).toBe(false);
  });

  it('equals returns true when imported class fields are structurally equal', async () => {
    const { PhoneNumber } = await import('./fixtures/phonenumber.ts');
    const { Person } = await import('./fixtures/person.ts');
    const a = new Person({
      name: 'Eve', tshirtSize: 'S',
      phone: new PhoneNumber({ areaCode: '206', phoneNumber: '5552222' }),
    });
    const b = new Person({
      name: 'Eve', tshirtSize: 'S',
      phone: new PhoneNumber({ areaCode: '206', phoneNumber: '5552222' }),
    });
    expect(a.equals(b)).toBe(true);
  });
```

- [ ] **Step 2: Add tests to transitive-dependencies.test.ts**

Add inside the existing `describe('mixed freezed and non-freezed imports', ...)` block:

```typescript
  it('equals detects PhoneNumber differences', async () => {
    const { Address } = await import('./fixtures/address.ts');
    const { PhoneNumber } = await import('./fixtures/phonenumber.ts');
    const { Person } = await import('./fixtures/person.ts');
    const addr = new Address({ street: '1 Elm St', state: 'CA' });
    const a = new Person({
      name: 'Alice', address: addr,
      phone: new PhoneNumber({ areaCode: '415', phoneNumber: '5551111' }),
    });
    const b = new Person({
      name: 'Alice', address: addr,
      phone: new PhoneNumber({ areaCode: '212', phoneNumber: '5551111' }),
    });
    expect(a.equals(b)).toBe(false);
  });

  it('equals returns true when PhoneNumbers are structurally equal', async () => {
    const { Address } = await import('./fixtures/address.ts');
    const { PhoneNumber } = await import('./fixtures/phonenumber.ts');
    const { Person } = await import('./fixtures/person.ts');
    const addr = new Address({ street: '1 Elm St', state: 'CA' });
    const a = new Person({
      name: 'Alice', address: addr,
      phone: new PhoneNumber({ areaCode: '415', phoneNumber: '5551111' }),
    });
    const b = new Person({
      name: 'Alice', address: addr,
      phone: new PhoneNumber({ areaCode: '415', phoneNumber: '5551111' }),
    });
    expect(a.equals(b)).toBe(true);
  });
```

- [ ] **Step 3: Run tests**

Run: `bun test tests/import-type/import-type.test.ts tests/transitive-dependencies/transitive-dependencies.test.ts`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add tests/import-type/import-type.test.ts tests/transitive-dependencies/transitive-dependencies.test.ts
git commit -m "test: add phone number equality tests for import-type and transitive deps"
```

---

## Task 14: C2 — Equality Cross-Module Imported Types

**Files:**
- Create: `tests/equality/fixtures/coord.ts`
- Create: `tests/equality/fixtures/cross-module.ts`
- Create: `tests/equality/fixtures/map-set-imported.ts`
- Modify: `tests/equality/equality.test.ts`
- Modify: `tests/equality/map-set-equality.test.ts`

- [ ] **Step 1: Create coord.ts**

```typescript
export interface Coord {
  x: number;
  y: number;
}
```

- [ ] **Step 2: Create cross-module.ts**

```typescript
import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import type { Coord } from './coord.ts';
import { $Locatable } from './cross-module.freezed.ts';

@freezed()
class Locatable extends $Locatable {
  constructor(params: { name: string; position: Coord }) {
    super(params);
  }
}

export { Locatable };
```

- [ ] **Step 3: Create map-set-imported.ts**

```typescript
import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import type { Coord } from './coord.ts';
import { $Registry } from './map-set-imported.freezed.ts';

@freezed()
class Registry extends $Registry {
  constructor(params: { entries: Map<string, Coord>; coordSet: Set<string> }) {
    super(params);
  }
}

export { Registry };
```

- [ ] **Step 4: Add cross-module.ts to equality.test.ts generate() call**

In `equality.test.ts`, add to the files array:
```typescript
path.join(fixturesDir, 'cross-module.ts'),
```

- [ ] **Step 5: Add cross-module test block to equality.test.ts**

```typescript
describe('equality -- cross-module imported types', () => {
  it('deep equality with cross-module imported type', async () => {
    const { Locatable } = await import('./fixtures/cross-module.ts');
    const a = new Locatable({ name: 'a', position: { x: 1, y: 2 } });
    const b = new Locatable({ name: 'a', position: { x: 1, y: 2 } });
    expect(a.equals(b)).toBe(true);
  });

  it('detects difference in cross-module imported field', async () => {
    const { Locatable } = await import('./fixtures/cross-module.ts');
    const a = new Locatable({ name: 'a', position: { x: 1, y: 2 } });
    const b = new Locatable({ name: 'a', position: { x: 1, y: 9 } });
    expect(a.equals(b)).toBe(false);
  });

  it('works with same reference for imported field', async () => {
    const { Locatable } = await import('./fixtures/cross-module.ts');
    const a = new Locatable({ name: 'a', position: { x: 1, y: 2 } });
    expect(a.equals(a)).toBe(true);
  });
});
```

- [ ] **Step 6: Add map-set-imported.ts to map-set-equality.test.ts generate() call**

In `map-set-equality.test.ts`, add to the files array:
```typescript
path.resolve('tests/equality/fixtures/map-set-imported.ts'),
```

- [ ] **Step 7: Add map-set imported test block to map-set-equality.test.ts**

```typescript
describe('Map with imported-type values', () => {
  it('equal entries compare equal', async () => {
    const { Registry } = await import('./fixtures/map-set-imported.ts');
    const a = new Registry({
      entries: new Map([['origin', { x: 0, y: 0 }]]),
      coordSet: new Set(['a']),
    });
    const b = new Registry({
      entries: new Map([['origin', { x: 0, y: 0 }]]),
      coordSet: new Set(['a']),
    });
    expect(a.equals(b)).toBe(true);
  });

  it('different Coord values compare not equal', async () => {
    const { Registry } = await import('./fixtures/map-set-imported.ts');
    const a = new Registry({
      entries: new Map([['origin', { x: 0, y: 0 }]]),
      coordSet: new Set(['a']),
    });
    const b = new Registry({
      entries: new Map([['origin', { x: 9, y: 9 }]]),
      coordSet: new Set(['a']),
    });
    expect(a.equals(b)).toBe(false);
  });
});
```

- [ ] **Step 8: Run tests**

Run: `bun test tests/equality/equality.test.ts tests/equality/map-set-equality.test.ts`
Expected: All tests pass

- [ ] **Step 9: Commit**

```bash
git add tests/equality/fixtures/coord.ts tests/equality/fixtures/cross-module.ts tests/equality/fixtures/map-set-imported.ts tests/equality/equality.test.ts tests/equality/map-set-equality.test.ts
git commit -m "test: add cross-module imported type equality tests"
```

---

## Task 15: C3 — Deep Copy Cross-File with Imported Types

**Files:**
- Create: `tests/deep-copy/fixtures/coord.ts`
- Create: `tests/deep-copy/fixtures/locatable.ts`
- Create: `tests/deep-copy/fixtures/route.ts`
- Modify: `tests/deep-copy/deep-copy.test.ts`

- [ ] **Step 1: Create coord.ts**

```typescript
export interface Coord {
  x: number;
  y: number;
}
```

- [ ] **Step 2: Create locatable.ts**

```typescript
import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import type { Coord } from './coord.ts';
import { $Locatable } from './locatable.freezed.ts';

@freezed()
class Locatable extends $Locatable {
  constructor(params: { label: string; position: Coord }) {
    super(params);
  }
}

export { Locatable };
```

- [ ] **Step 3: Create route.ts**

```typescript
import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import { Locatable } from './locatable.ts';
import { $Route } from './route.freezed.ts';

@freezed()
class Route extends $Route {
  constructor(params: { name: string; origin: Locatable }) {
    super(params);
  }
}

export { Route };
```

- [ ] **Step 4: Add fixtures to generate() call**

In `deep-copy.test.ts`, update `beforeAll`:
```typescript
beforeAll(() => {
  generate([
    path.join(fixturesDir, 'company.ts'),
    path.join(fixturesDir, 'locatable.ts'),
    path.join(fixturesDir, 'route.ts'),
  ]);
});
```

- [ ] **Step 5: Add test block**

```typescript
describe('deep copy -- cross-file imported types', () => {
  it('constructs with cross-file nested freezed + imported type', async () => {
    const { Locatable } = await import('./fixtures/locatable.ts');
    const { Route } = await import('./fixtures/route.ts');
    const route = new Route({
      name: 'r',
      origin: new Locatable({ label: 'a', position: { x: 1, y: 2 } }),
    });
    expect(route.name).toBe('r');
    expect(route.origin.label).toBe('a');
    expect(route.origin.position).toEqual({ x: 1, y: 2 });
  });

  it('with() replaces top-level field', async () => {
    const { Locatable } = await import('./fixtures/locatable.ts');
    const { Route } = await import('./fixtures/route.ts');
    const route = new Route({
      name: 'r',
      origin: new Locatable({ label: 'a', position: { x: 1, y: 2 } }),
    });
    const r2 = route.with({ name: 'new' });
    expect(r2.name).toBe('new');
    expect(r2.origin.label).toBe('a');
  });

  it('deep with on cross-file freezed property', async () => {
    const { Locatable } = await import('./fixtures/locatable.ts');
    const { Route } = await import('./fixtures/route.ts');
    const route = new Route({
      name: 'r',
      origin: new Locatable({ label: 'a', position: { x: 1, y: 2 } }),
    });
    const r2 = route.with.origin({ label: 'b' });
    expect(r2.origin.label).toBe('b');
    expect(r2.origin.position).toEqual({ x: 1, y: 2 });
    expect(r2.name).toBe('r');
  });

  it('deep with on cross-file freezed property replaces imported-type field', async () => {
    const { Locatable } = await import('./fixtures/locatable.ts');
    const { Route } = await import('./fixtures/route.ts');
    const route = new Route({
      name: 'r',
      origin: new Locatable({ label: 'a', position: { x: 1, y: 2 } }),
    });
    const r2 = route.with.origin({ position: { x: 9, y: 9 } });
    expect(r2.origin.position).toEqual({ x: 9, y: 9 });
  });

  it('original not modified after deep with', async () => {
    const { Locatable } = await import('./fixtures/locatable.ts');
    const { Route } = await import('./fixtures/route.ts');
    const route = new Route({
      name: 'r',
      origin: new Locatable({ label: 'a', position: { x: 1, y: 2 } }),
    });
    route.with.origin({ label: 'changed' });
    expect(route.origin.label).toBe('a');
  });

  it('result is frozen including imported type field', async () => {
    const { Locatable } = await import('./fixtures/locatable.ts');
    const { Route } = await import('./fixtures/route.ts');
    const route = new Route({
      name: 'r',
      origin: new Locatable({ label: 'a', position: { x: 1, y: 2 } }),
    });
    const r2 = route.with.origin({ label: 'b' });
    expect(Object.isFrozen(r2)).toBe(true);
    expect(Object.isFrozen(r2.origin)).toBe(true);
    expect(Object.isFrozen(r2.origin.position)).toBe(true);
  });
});
```

- [ ] **Step 6: Run tests**

Run: `bun test tests/deep-copy/deep-copy.test.ts`
Expected: All tests pass

- [ ] **Step 7: Commit**

```bash
git add tests/deep-copy/fixtures/coord.ts tests/deep-copy/fixtures/locatable.ts tests/deep-copy/fixtures/route.ts tests/deep-copy/deep-copy.test.ts
git commit -m "test: add cross-file imported type tests for deep copy"
```

---

## Task 16: C4+C10 — ToString and Cross-File Non-Freezed Imports

**Files:**
- Create: `tests/toString/fixtures/coord.ts`
- Create: `tests/toString/fixtures/with-import.ts`
- Modify: `tests/toString/toString.test.ts`
- Create: `tests/cross-file/fixtures/coord.ts`
- Create: `tests/cross-file/fixtures/place.ts`
- Modify: `tests/cross-file/cross-file.test.ts`

### toString portion

- [ ] **Step 1: Create tests/toString/fixtures/coord.ts**

```typescript
export interface Coord {
  x: number;
  y: number;
}
```

- [ ] **Step 2: Create tests/toString/fixtures/with-import.ts**

```typescript
import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import type { Coord } from './coord.ts';
import { $Waypoint } from './with-import.freezed.ts';

@freezed()
class Waypoint extends $Waypoint {
  constructor(params: { name: string; position: Coord }) {
    super(params);
  }
}

export { Waypoint };
```

- [ ] **Step 3: Add with-import.ts to toString.test.ts generate() call**

Add `path.join(fixturesDir, 'with-import.ts')` to the files array.

- [ ] **Step 4: Add toString test block**

```typescript
describe('toString() — imported non-freezed types', () => {
  it('toString includes imported non-freezed type field', async () => {
    const { Waypoint } = await import('./fixtures/with-import.ts');
    const w = new Waypoint({ name: 'a', position: { x: 1, y: 2 } });
    expect(w.toString()).toContain('position:');
  });

  it('toString representation of plain object field', async () => {
    const { Waypoint } = await import('./fixtures/with-import.ts');
    const w = new Waypoint({ name: 'a', position: { x: 1, y: 2 } });
    // Documents actual behavior — plain objects render as [object Object]
    const str = w.toString();
    expect(str).toContain('Waypoint(');
    expect(str).toContain('name: a');
  });
});
```

### cross-file portion

- [ ] **Step 5: Create tests/cross-file/fixtures/coord.ts**

```typescript
export interface Coord {
  x: number;
  y: number;
}
```

- [ ] **Step 6: Create tests/cross-file/fixtures/place.ts**

```typescript
import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import type { Coord } from './coord.ts';
import { $Place } from './place.freezed.ts';

@freezed()
class Place extends $Place {
  constructor(params: { name: string; location: Coord }) {
    super(params);
  }
}

export { Place };
```

- [ ] **Step 7: Add place.ts to cross-file.test.ts generate() call**

Add `path.resolve('tests/cross-file/fixtures/place.ts')` to the files array.

- [ ] **Step 8: Add cross-file test block**

Add `import * as fs from 'node:fs';` at the top if not already present.

```typescript
describe('cross-file -- non-freezed imported type', () => {
  it('constructs with cross-file imported interface field', async () => {
    const { Place } = await import('./fixtures/place.ts');
    const p = new Place({ name: 'park', location: { x: 1, y: 2 } });
    expect(p.name).toBe('park');
    expect(p.location).toEqual({ x: 1, y: 2 });
  });

  it('imported interface field is frozen', async () => {
    const { Place } = await import('./fixtures/place.ts');
    const p = new Place({ name: 'park', location: { x: 1, y: 2 } });
    expect(Object.isFrozen(p.location)).toBe(true);
  });

  it('with() replaces imported interface field', async () => {
    const { Place } = await import('./fixtures/place.ts');
    const p = new Place({ name: 'park', location: { x: 1, y: 2 } });
    const p2 = p.with({ location: { x: 9, y: 9 } });
    expect(p2.location).toEqual({ x: 9, y: 9 });
    expect(p2).not.toBe(p);
  });

  it('equals works with imported interface field', async () => {
    const { Place } = await import('./fixtures/place.ts');
    const a = new Place({ name: 'park', location: { x: 1, y: 2 } });
    const b = new Place({ name: 'park', location: { x: 1, y: 2 } });
    expect(a.equals(b)).toBe(true);
    const c = new Place({ name: 'park', location: { x: 9, y: 9 } });
    expect(a.equals(c)).toBe(false);
  });

  it('generated file imports non-freezed type', () => {
    const content = fs.readFileSync(
      path.resolve('tests/cross-file/fixtures/place.freezed.ts'), 'utf-8',
    );
    expect(content).toContain("import type { Coord } from './coord.js'");
  });

  it('generated file does NOT produce a CoordWith type', () => {
    const content = fs.readFileSync(
      path.resolve('tests/cross-file/fixtures/place.freezed.ts'), 'utf-8',
    );
    expect(content).not.toContain('CoordWith');
  });
});
```

- [ ] **Step 9: Run tests**

Run: `bun test tests/toString/toString.test.ts tests/cross-file/cross-file.test.ts`
Expected: All tests pass

- [ ] **Step 10: Commit**

```bash
git add tests/toString/fixtures/coord.ts tests/toString/fixtures/with-import.ts tests/toString/toString.test.ts tests/cross-file/fixtures/coord.ts tests/cross-file/fixtures/place.ts tests/cross-file/cross-file.test.ts
git commit -m "test: add imported type tests for toString and cross-file non-freezed types"
```

---

## Task 17: C5+C6+C7+C9 — Small Targeted Additions

**Files:**
- Modify: `tests/union-special-types/union-special-types.test.ts`
- Modify: `tests/anonymous-objects/anonymous-objects.test.ts`
- Modify: `tests/generic-freezed-class/generic-freezed-class.test.ts`
- Modify: `tests/edge-cases/edge-cases.test.ts`

No new fixtures needed for any of these.

### C5: union-special-types

- [ ] **Step 1: Add Alpha union equality tests**

Add inside the existing `describe('union with undefined and any', ...)` block:

```typescript
  it('equals detects difference in Alpha union values', async () => {
    const { Loose } = await import('./fixtures/loose.ts');
    const a = new Loose({
      maybe: 'x', anything: 42,
      unionUndef: { kind: 'alpha', value: 'x' },
    });
    const b = new Loose({
      maybe: 'x', anything: 42,
      unionUndef: { kind: 'alpha', value: 'y' },
    });
    expect(a.equals(b)).toBe(false);
  });

  it('equals returns true for identical Alpha values', async () => {
    const { Loose } = await import('./fixtures/loose.ts');
    const a = new Loose({
      maybe: 'x', anything: 42,
      unionUndef: { kind: 'alpha', value: 'same' },
    });
    const b = new Loose({
      maybe: 'x', anything: 42,
      unionUndef: { kind: 'alpha', value: 'same' },
    });
    expect(a.equals(b)).toBe(true);
  });
```

### C6: anonymous-objects

- [ ] **Step 2: Add anonymous object imported type tests**

Add inside the existing `describe('anonymous object types', ...)` block:

```typescript
  it('equals detects difference in imported Coord inside anonymous object', async () => {
    const { WithObjects } = await import('./fixtures/with-objects.ts');
    const base = {
      shallow: { x: 1, y: 2 },
      deep: { outer: { inner: 'hello', count: 3 } },
      withExternal: { tags: [{ key: 'a', value: 'b' }], active: true },
    };
    const a = new WithObjects({ ...base, withImported: { position: { x: 10, y: 20 }, label: 'a' } });
    const b = new WithObjects({ ...base, withImported: { position: { x: 10, y: 99 }, label: 'a' } });
    expect(a.equals(b)).toBe(false);
  });

  it('with() replaces anonymous object containing imported type', async () => {
    const { WithObjects } = await import('./fixtures/with-objects.ts');
    const wo = new WithObjects({
      shallow: { x: 1, y: 2 },
      deep: { outer: { inner: 'hello', count: 3 } },
      withImported: { position: { x: 10, y: 20 }, label: 'origin' },
      withExternal: { tags: [{ key: 'a', value: 'b' }], active: true },
    });
    const updated = wo.with({ withImported: { position: { x: 5, y: 5 }, label: 'new' } });
    expect(updated.withImported.position).toEqual({ x: 5, y: 5 });
    expect(updated.withImported.label).toBe('new');
  });

  it('with() replaces anonymous object containing imported array type', async () => {
    const { WithObjects } = await import('./fixtures/with-objects.ts');
    const wo = new WithObjects({
      shallow: { x: 1, y: 2 },
      deep: { outer: { inner: 'hello', count: 3 } },
      withImported: { position: { x: 10, y: 20 }, label: 'origin' },
      withExternal: { tags: [{ key: 'a', value: 'b' }], active: true },
    });
    const updated = wo.with({ withExternal: { tags: [{ key: 'new', value: 'tag' }], active: false } });
    expect(updated.withExternal.tags).toEqual([{ key: 'new', value: 'tag' }]);
    expect(updated.withExternal.active).toBe(false);
  });
```

### C7: generic-freezed-class

- [ ] **Step 3: Add Identifiable-typed value tests**

Add inside the existing `describe('@freezed class with simple generic <T>', ...)` block:

```typescript
  it('constructs with an Identifiable-typed value', async () => {
    const { SimpleGeneric } = await import('./fixtures/simple-generic.ts');
    const s = new SimpleGeneric({ value: { id: 'abc' }, label: 'test' });
    expect(s.value.id).toBe('abc');
  });

  it('Identifiable value is frozen', async () => {
    const { SimpleGeneric } = await import('./fixtures/simple-generic.ts');
    const s = new SimpleGeneric({ value: { id: 'abc' }, label: 'test' });
    expect(Object.isFrozen(s.value)).toBe(true);
  });

  it('equals works with Identifiable values', async () => {
    const { SimpleGeneric } = await import('./fixtures/simple-generic.ts');
    const a = new SimpleGeneric({ value: { id: 'abc' }, label: 'test' });
    const b = new SimpleGeneric({ value: { id: 'abc' }, label: 'test' });
    expect(a.equals(b)).toBe(true);
    const c = new SimpleGeneric({ value: { id: 'xyz' }, label: 'test' });
    expect(a.equals(c)).toBe(false);
  });
```

### C9: edge-cases

- [ ] **Step 4: Add Status | null with() test**

Add inside the existing `describe('nullable primitive types (string | null, number | null)', ...)` block:

```typescript
  it('with() replaces Status | null field', async () => {
    const { NullablePrimitives } = await import('./fixtures/nullable-primitives.ts');
    const np = new NullablePrimitives({
      name: 'x', count: 1, flag: true,
      status: { code: 200, message: 'ok' },
    });
    const np2 = np.with({ status: null });
    expect(np2.status).toBeNull();
    const np3 = np.with({ status: { code: 500, message: 'error' } });
    expect(np3.status).toEqual({ code: 500, message: 'error' });
  });
```

- [ ] **Step 5: Run all four test files**

Run: `bun test tests/union-special-types/union-special-types.test.ts tests/anonymous-objects/anonymous-objects.test.ts tests/generic-freezed-class/generic-freezed-class.test.ts tests/edge-cases/edge-cases.test.ts`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add tests/union-special-types/union-special-types.test.ts tests/anonymous-objects/anonymous-objects.test.ts tests/generic-freezed-class/generic-freezed-class.test.ts tests/edge-cases/edge-cases.test.ts
git commit -m "test: add targeted imported type tests for unions, anon objects, generics, edge cases"
```

---

## Summary

| Task | Category | Suite(s) | New Files | New Tests |
|------|----------|----------|-----------|-----------|
| 1 | A1 | generic-imports | 0 | 8 |
| 2 | A2 | generic-class-imports | 0 | 5 |
| 3 | A3 | transient-types | 0 | 6 |
| 4 | A4 | type-variants | 0 | 11 |
| 5 | A5 | multi-import | 0 | 6 |
| 6 | A6 | circular-dependencies | 0 (modify 2) | 4 |
| 7 | B1 | immutability | 2 | 5 |
| 8 | B2 | shallow-copy | 2 | 5 |
| 9 | B3 | collections | 2 | 8 |
| 10 | B4 | config | 3 | 6 |
| 11 | B5 | field-config | 3 | 7 |
| 12 | B6 | interface-params | 2 | 5 |
| 13 | C1+C8 | import-type, transitive-deps | 0 | 6 |
| 14 | C2 | equality | 3 | 5 |
| 15 | C3 | deep-copy | 3 | 6 |
| 16 | C4+C10 | toString, cross-file | 4 | 8 |
| 17 | C5+C6+C7+C9 | union, anon-obj, generic, edge | 0 | 9 |
| **Total** | | **22 suites** | **24 files** | **~110** |
