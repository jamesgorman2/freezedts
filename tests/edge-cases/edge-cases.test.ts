import { beforeAll, describe, it, expect } from 'bun:test';
import { generate } from '../../packages/freezedts-cli/src/generator/generator.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

const fixturesDir = path.resolve(import.meta.dirname, 'fixtures');

beforeAll(() => {
  generate([
    path.join(fixturesDir, 'nullable-primitives.ts'),
    path.join(fixturesDir, 'multi-nullable.ts'),
    path.join(fixturesDir, 'intersection.ts'),
    path.join(fixturesDir, 'tuple.ts'),
    path.join(fixturesDir, 'function-prop.ts'),
    path.join(fixturesDir, 'bigint-prop.ts'),
    path.join(fixturesDir, 'utility-types.ts'),
    path.join(fixturesDir, 'callback-class-types.ts'),
    path.join(fixturesDir, 'intersection-imported.ts'),
    path.join(fixturesDir, 'tuple-class-types.ts'),
  ]);
});

// --- Nullable primitives ---

describe('nullable primitive types (string | null, number | null)', () => {
  function readGenerated(): string {
    return fs.readFileSync(
      path.join(fixturesDir, 'nullable-primitives.freezed.ts'),
      'utf-8',
    );
  }

  it('preserves string | null in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('name: string | null');
  });

  it('preserves number | null in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('count: number | null');
  });

  it('preserves boolean | null in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('flag: boolean | null');
  });

  it('preserves Status | null in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('status: Status | null');
  });

  it('imports Status for the nullable imported type', () => {
    const generated = readGenerated();
    expect(generated).toContain("import type { Status } from './status.js';");
  });

  it('constructs with null values', async () => {
    const { NullablePrimitives } = await import('./fixtures/nullable-primitives.ts');
    const np = new NullablePrimitives({
      name: null, count: null, flag: null, status: null,
    });
    expect(np.name).toBeNull();
    expect(np.count).toBeNull();
    expect(np.flag).toBeNull();
    expect(np.status).toBeNull();
    expect(Object.isFrozen(np)).toBe(true);
  });

  it('constructs with non-null values', async () => {
    const { NullablePrimitives } = await import('./fixtures/nullable-primitives.ts');
    const np = new NullablePrimitives({
      name: 'hello', count: 42, flag: true,
      status: { code: 200, message: 'ok' },
    });
    expect(np.name).toBe('hello');
    expect(np.count).toBe(42);
    expect(np.flag).toBe(true);
    expect(np.status).toEqual({ code: 200, message: 'ok' });
  });

  it('equals works with null values', async () => {
    const { NullablePrimitives } = await import('./fixtures/nullable-primitives.ts');
    const a = new NullablePrimitives({ name: null, count: null, flag: null, status: null });
    const b = new NullablePrimitives({ name: null, count: null, flag: null, status: null });
    expect(a.equals(b)).toBe(true);
  });

  it('equals detects null vs non-null', async () => {
    const { NullablePrimitives } = await import('./fixtures/nullable-primitives.ts');
    const a = new NullablePrimitives({ name: 'x', count: null, flag: null, status: null });
    const b = new NullablePrimitives({ name: null, count: null, flag: null, status: null });
    expect(a.equals(b)).toBe(false);
  });

  it('with() works for nullable properties', async () => {
    const { NullablePrimitives } = await import('./fixtures/nullable-primitives.ts');
    const np1 = new NullablePrimitives({ name: 'x', count: 1, flag: true, status: null });
    const np2 = np1.with({ name: null });
    expect(np2.name).toBeNull();
    expect(np2.count).toBe(1);
  });
});

// --- Multiple nullability modifiers ---

describe('multiple nullability (string | null | undefined)', () => {
  function readGenerated(): string {
    return fs.readFileSync(
      path.join(fixturesDir, 'multi-nullable.freezed.ts'),
      'utf-8',
    );
  }

  it('preserves string | null | undefined in generated output', () => {
    const generated = readGenerated();
    expect(generated).toContain('tripleNull: string | null | undefined');
  });

  it('preserves Status | null | undefined in generated output', () => {
    const generated = readGenerated();
    expect(generated).toContain('importedTriple: Status | null | undefined');
  });

  it('imports Status for the triple-nullable imported type', () => {
    const generated = readGenerated();
    expect(generated).toContain("import type { Status } from './status.js';");
  });

  it('constructs with null', async () => {
    const { MultiNullable } = await import('./fixtures/multi-nullable.ts');
    const m = new MultiNullable({ tripleNull: null, importedTriple: null });
    expect(m.tripleNull).toBeNull();
    expect(m.importedTriple).toBeNull();
  });

  it('constructs with undefined', async () => {
    const { MultiNullable } = await import('./fixtures/multi-nullable.ts');
    const m = new MultiNullable({ tripleNull: undefined, importedTriple: undefined });
    expect(m.tripleNull).toBeUndefined();
    expect(m.importedTriple).toBeUndefined();
  });

  it('constructs with actual values', async () => {
    const { MultiNullable } = await import('./fixtures/multi-nullable.ts');
    const m = new MultiNullable({
      tripleNull: 'hello',
      importedTriple: { code: 200, message: 'ok' },
    });
    expect(m.tripleNull).toBe('hello');
    expect(m.importedTriple).toEqual({ code: 200, message: 'ok' });
  });

  it('equals handles null vs undefined', async () => {
    const { MultiNullable } = await import('./fixtures/multi-nullable.ts');
    const a = new MultiNullable({ tripleNull: null, importedTriple: null });
    const b = new MultiNullable({ tripleNull: undefined, importedTriple: undefined });
    // null !== undefined in deepEqual
    expect(a.equals(b)).toBe(false);
  });
});

// --- Intersection types ---

describe('intersection types (Named & Aged)', () => {
  function readGenerated(): string {
    return fs.readFileSync(
      path.join(fixturesDir, 'intersection.freezed.ts'),
      'utf-8',
    );
  }

  it('preserves Named & Aged in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('person: Named & Aged');
  });

  it('generates without errors', () => {
    const result = generate([path.join(fixturesDir, 'intersection.ts')]);
    expect(result.errors).toHaveLength(0);
  });

  it('constructs with intersection-shaped object', async () => {
    const { WithIntersection } = await import('./fixtures/intersection.ts');
    const wi = new WithIntersection({
      person: { name: 'Alice', age: 30 },
      label: 'test',
    });
    expect(wi.person).toEqual({ name: 'Alice', age: 30 });
    expect(wi.label).toBe('test');
    expect(Object.isFrozen(wi)).toBe(true);
  });

  it('equals works on intersection types', async () => {
    const { WithIntersection } = await import('./fixtures/intersection.ts');
    const a = new WithIntersection({ person: { name: 'A', age: 1 }, label: 'x' });
    const b = new WithIntersection({ person: { name: 'A', age: 1 }, label: 'x' });
    expect(a.equals(b)).toBe(true);
  });

  it('freezes intersection-typed properties', async () => {
    const { WithIntersection } = await import('./fixtures/intersection.ts');
    const wi = new WithIntersection({
      person: { name: 'Alice', age: 30 },
      label: 'test',
    });
    expect(() => { (wi.person as any).name = 'Bob'; }).toThrow();
  });

  it('does not import locally-defined intersection component types', () => {
    const generated = readGenerated();
    const typeImports = generated.split('\n').filter(l =>
      l.startsWith('import type') && !l.includes('freezedts/runtime'),
    );
    expect(typeImports).toEqual([]);
  });
});

// --- Tuple types ---

describe('tuple types ([number, number])', () => {
  function readGenerated(): string {
    return fs.readFileSync(
      path.join(fixturesDir, 'tuple.freezed.ts'),
      'utf-8',
    );
  }

  it('preserves [number, number] in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('point: [number, number]');
  });

  it('preserves [string, number] in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('entry: [string, number]');
  });

  it('constructs with tuple values', async () => {
    const { WithTuple } = await import('./fixtures/tuple.ts');
    const wt = new WithTuple({
      point: [1, 2],
      entry: ['key', 42],
    });
    expect(wt.point).toEqual([1, 2]);
    expect(wt.entry).toEqual(['key', 42]);
    expect(Object.isFrozen(wt)).toBe(true);
  });

  it('freezes tuples (cannot mutate elements)', async () => {
    const { WithTuple } = await import('./fixtures/tuple.ts');
    const wt = new WithTuple({ point: [1, 2], entry: ['a', 1] });
    expect(() => { (wt.point as any)[0] = 99; }).toThrow();
  });

  it('equals works on tuples', async () => {
    const { WithTuple } = await import('./fixtures/tuple.ts');
    const a = new WithTuple({ point: [1, 2], entry: ['x', 3] });
    const b = new WithTuple({ point: [1, 2], entry: ['x', 3] });
    expect(a.equals(b)).toBe(true);
  });

  it('equals detects differences in tuples', async () => {
    const { WithTuple } = await import('./fixtures/tuple.ts');
    const a = new WithTuple({ point: [1, 2], entry: ['x', 3] });
    const b = new WithTuple({ point: [1, 3], entry: ['x', 3] });
    expect(a.equals(b)).toBe(false);
  });

  it('with() works for tuple properties', async () => {
    const { WithTuple } = await import('./fixtures/tuple.ts');
    const wt1 = new WithTuple({ point: [1, 2], entry: ['a', 1] });
    const wt2 = wt1.with({ point: [3, 4] });
    expect(wt2.point).toEqual([3, 4]);
    expect(wt2.entry).toEqual(['a', 1]);
  });
});

// --- Function type properties ---

describe('function type properties ((value: string) => void)', () => {
  function readGenerated(): string {
    return fs.readFileSync(
      path.join(fixturesDir, 'function-prop.freezed.ts'),
      'utf-8',
    );
  }

  it('preserves (value: string) => void in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('handler: (value: string) => void');
  });

  it('preserves (x: number) => boolean in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('predicate: (x: number) => boolean');
  });

  it('constructs with function values', async () => {
    const { WithCallback } = await import('./fixtures/function-prop.ts');
    const handler = (_v: string) => {};
    const predicate = (x: number) => x > 0;
    const wc = new WithCallback({ handler, predicate, label: 'test' });
    expect(wc.handler).toBe(handler);
    expect(wc.predicate).toBe(predicate);
    expect(wc.label).toBe('test');
    expect(Object.isFrozen(wc)).toBe(true);
  });

  it('equals uses reference equality for functions', async () => {
    const { WithCallback } = await import('./fixtures/function-prop.ts');
    const handler = () => {};
    const predicate = (x: number) => x > 0;
    const a = new WithCallback({ handler, predicate, label: 'a' });
    const b = new WithCallback({ handler, predicate, label: 'a' });
    expect(a.equals(b)).toBe(true);
  });

  it('equals detects different function references', async () => {
    const { WithCallback } = await import('./fixtures/function-prop.ts');
    const a = new WithCallback({ handler: () => {}, predicate: () => true, label: 'a' });
    const b = new WithCallback({ handler: () => {}, predicate: () => true, label: 'a' });
    // Different function references → not equal
    expect(a.equals(b)).toBe(false);
  });
});

// --- bigint properties ---

describe('bigint properties', () => {
  function readGenerated(): string {
    return fs.readFileSync(
      path.join(fixturesDir, 'bigint-prop.freezed.ts'),
      'utf-8',
    );
  }

  it('preserves bigint in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('id: bigint');
  });

  it('treats bigint as a primitive (no deepFreeze)', () => {
    const generated = readGenerated();
    // Should use direct assignment, not deepFreeze
    expect(generated).toContain('this.id = params.id');
    expect(generated).not.toContain('this.id = deepFreeze(params.id)');
  });

  it('uses === for bigint equality', () => {
    const generated = readGenerated();
    // Should use direct comparison, not deepEqual
    expect(generated).toContain('this.id === other.id');
  });

  it('constructs with bigint value', async () => {
    const { WithBigInt } = await import('./fixtures/bigint-prop.ts');
    const wb = new WithBigInt({ id: 123n, label: 'test' });
    expect(wb.id).toBe(123n);
    expect(wb.label).toBe('test');
    expect(Object.isFrozen(wb)).toBe(true);
  });

  it('equals works for bigint', async () => {
    const { WithBigInt } = await import('./fixtures/bigint-prop.ts');
    const a = new WithBigInt({ id: 100n, label: 'x' });
    const b = new WithBigInt({ id: 100n, label: 'x' });
    const c = new WithBigInt({ id: 200n, label: 'x' });
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});

// --- Utility types ---

describe('utility types (Partial<T>, Pick<T,K>, Record<K,V>)', () => {
  function readGenerated(): string {
    return fs.readFileSync(
      path.join(fixturesDir, 'utility-types.freezed.ts'),
      'utf-8',
    );
  }

  it('preserves Partial<Status> in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('partial: Partial<Status>');
  });

  it('preserves Pick<Status, \'code\'> in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain("picked: Pick<Status, 'code'>");
  });

  it('preserves Record<string, number> in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('record: Record<string, number>');
  });

  it('imports Status (but not Partial/Pick/Record built-ins)', () => {
    const generated = readGenerated();
    expect(generated).toContain("import type { Status } from './status.js';");
    // Built-in utility types should NOT appear in imports
    const importLines = generated.split('\n').filter(l =>
      l.startsWith('import') && l.includes('from') && !l.includes('freezedts/runtime'),
    );
    for (const line of importLines) {
      const braceContent = line.match(/\{([^}]+)\}/)?.[1] ?? '';
      expect(braceContent).not.toMatch(/\bPartial\b/);
      expect(braceContent).not.toMatch(/\bPick\b/);
      expect(braceContent).not.toMatch(/\bRecord\b/);
    }
  });

  it('constructs with utility-typed properties', async () => {
    const { WithUtilityTypes } = await import('./fixtures/utility-types.ts');
    const wut = new WithUtilityTypes({
      partial: { code: 200 },
      picked: { code: 404 },
      record: { a: 1, b: 2 },
    });
    expect(wut.partial).toEqual({ code: 200 });
    expect(wut.picked).toEqual({ code: 404 });
    expect(wut.record).toEqual({ a: 1, b: 2 });
    expect(Object.isFrozen(wut)).toBe(true);
  });

  it('equals works with utility types', async () => {
    const { WithUtilityTypes } = await import('./fixtures/utility-types.ts');
    const params = {
      partial: { code: 200 },
      picked: { code: 404 },
      record: { a: 1 },
    };
    const a = new WithUtilityTypes(params);
    const b = new WithUtilityTypes(params);
    expect(a.equals(b)).toBe(true);
  });

  it('freezes utility-typed objects', async () => {
    const { WithUtilityTypes } = await import('./fixtures/utility-types.ts');
    const wut = new WithUtilityTypes({
      partial: { code: 200 },
      picked: { code: 404 },
      record: { a: 1 },
    });
    expect(() => { (wut.record as any).a = 99; }).toThrow();
    expect(() => { (wut.partial as any).code = 99; }).toThrow();
  });
});

// --- Function properties with imported class/interface types ---

describe('function properties with imported class/interface types', () => {
  function readGenerated(): string {
    return fs.readFileSync(
      path.join(fixturesDir, 'callback-class-types.freezed.ts'),
      'utf-8',
    );
  }

  it('preserves (status: Status) => void in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('onStatus: (status: Status) => void');
  });

  it('preserves (id: string) => Status in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('fetchStatus: (id: string) => Status');
  });

  it('preserves (input: Config) => Status in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('transform: (input: Config) => Status');
  });

  it('preserves (items: Wrapper<Status>) => Pair<string, Status> in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('processWrapped: (items: Wrapper<Status>) => Pair<string, Status>');
  });

  it('generates correct type imports in natural order', () => {
    const generated = readGenerated();
    const typeImports = generated.split('\n').filter(l =>
      l.startsWith('import type') && !l.includes('freezedts/runtime'),
    );
    expect(typeImports).toEqual([
      "import type { Config } from './config.js';",
      "import type { Pair } from './pair.js';",
      "import type { Status } from './status.js';",
      "import type { Wrapper } from './wrapper.js';",
    ]);
  });

  it('constructs with function values', async () => {
    const { CallbackClassTypes } = await import('./fixtures/callback-class-types.ts');
    const onStatus = (_s: any) => {};
    const fetchStatus = (_id: string) => ({ code: 200, message: 'ok' });
    const transform = (_c: any) => ({ code: 200, message: 'ok' });
    const processWrapped = (_items: any) => ({ first: 'a', second: { code: 200, message: 'ok' } });
    const inst = new CallbackClassTypes({
      onStatus,
      fetchStatus,
      transform,
      processWrapped,
      label: 'test',
    });
    expect(inst.onStatus).toBe(onStatus);
    expect(inst.fetchStatus).toBe(fetchStatus);
    expect(inst.transform).toBe(transform);
    expect(inst.processWrapped).toBe(processWrapped);
    expect(inst.label).toBe('test');
    expect(Object.isFrozen(inst)).toBe(true);
  });

  it('equals uses reference equality for functions (same refs)', async () => {
    const { CallbackClassTypes } = await import('./fixtures/callback-class-types.ts');
    const onStatus = () => {};
    const fetchStatus = () => ({ code: 200, message: 'ok' });
    const transform = () => ({ code: 200, message: 'ok' });
    const processWrapped = () => ({ first: 'a', second: { code: 200, message: 'ok' } });
    const a = new CallbackClassTypes({ onStatus, fetchStatus, transform, processWrapped, label: 'x' });
    const b = new CallbackClassTypes({ onStatus, fetchStatus, transform, processWrapped, label: 'x' });
    expect(a.equals(b)).toBe(true);
  });

  it('equals detects different function references', async () => {
    const { CallbackClassTypes } = await import('./fixtures/callback-class-types.ts');
    const shared = {
      fetchStatus: () => ({ code: 200, message: 'ok' }),
      transform: () => ({ code: 200, message: 'ok' }),
      processWrapped: () => ({ first: 'a', second: { code: 200, message: 'ok' } }),
      label: 'x',
    };
    const a = new CallbackClassTypes({ onStatus: () => {}, ...shared });
    const b = new CallbackClassTypes({ onStatus: () => {}, ...shared });
    expect(a.equals(b)).toBe(false);
  });

  it('with() replaces a callback property', async () => {
    const { CallbackClassTypes } = await import('./fixtures/callback-class-types.ts');
    const onStatus1 = () => {};
    const onStatus2 = () => {};
    const fetchStatus = () => ({ code: 200, message: 'ok' });
    const transform = () => ({ code: 200, message: 'ok' });
    const processWrapped = () => ({ first: 'a', second: { code: 200, message: 'ok' } });
    const inst1 = new CallbackClassTypes({ onStatus: onStatus1, fetchStatus, transform, processWrapped, label: 'x' });
    const inst2 = inst1.with({ onStatus: onStatus2 });
    expect(inst2.onStatus).toBe(onStatus2);
    expect(inst2.fetchStatus).toBe(fetchStatus);
    expect(inst2.label).toBe('x');
    expect(Object.isFrozen(inst2)).toBe(true);
  });
});

// --- Intersection types with imported types ---

describe('intersection types with imported types (Status & Taggable)', () => {
  function readGenerated(): string {
    return fs.readFileSync(
      path.join(fixturesDir, 'intersection-imported.freezed.ts'),
      'utf-8',
    );
  }

  it('preserves Status & Taggable in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('item: Status & Taggable');
  });

  it('generates correct type imports in natural order', () => {
    const generated = readGenerated();
    const typeImports = generated.split('\n').filter(l =>
      l.startsWith('import type') && !l.includes('freezedts/runtime'),
    );
    expect(typeImports).toEqual([
      "import type { Status } from './status.js';",
      "import type { Taggable } from './taggable.js';",
    ]);
  });

  it('constructs with intersection-shaped object', async () => {
    const { WithImportedIntersection } = await import('./fixtures/intersection-imported.ts');
    const wi = new WithImportedIntersection({
      item: { code: 200, message: 'ok', tags: ['web'] },
      label: 'test',
    });
    expect(wi.item).toEqual({ code: 200, message: 'ok', tags: ['web'] });
    expect(wi.label).toBe('test');
    expect(Object.isFrozen(wi)).toBe(true);
  });

  it('equals works on imported intersection types', async () => {
    const { WithImportedIntersection } = await import('./fixtures/intersection-imported.ts');
    const a = new WithImportedIntersection({
      item: { code: 200, message: 'ok', tags: ['web'] },
      label: 'test',
    });
    const b = new WithImportedIntersection({
      item: { code: 200, message: 'ok', tags: ['web'] },
      label: 'test',
    });
    expect(a.equals(b)).toBe(true);
  });

  it('equals detects differences in intersection-typed properties', async () => {
    const { WithImportedIntersection } = await import('./fixtures/intersection-imported.ts');
    const a = new WithImportedIntersection({
      item: { code: 200, message: 'ok', tags: ['web'] },
      label: 'test',
    });
    const b = new WithImportedIntersection({
      item: { code: 404, message: 'not found', tags: ['error'] },
      label: 'test',
    });
    expect(a.equals(b)).toBe(false);
  });

  it('freezes imported intersection-typed properties', async () => {
    const { WithImportedIntersection } = await import('./fixtures/intersection-imported.ts');
    const wi = new WithImportedIntersection({
      item: { code: 200, message: 'ok', tags: ['web'] },
      label: 'test',
    });
    expect(() => { (wi.item as any).code = 999; }).toThrow();
    expect(() => { (wi.item as any).tags.push('new'); }).toThrow();
  });

  it('with() works for imported intersection-typed properties', async () => {
    const { WithImportedIntersection } = await import('./fixtures/intersection-imported.ts');
    const wi1 = new WithImportedIntersection({
      item: { code: 200, message: 'ok', tags: ['web'] },
      label: 'test',
    });
    const wi2 = wi1.with({ item: { code: 404, message: 'not found', tags: ['error'] } });
    expect(wi2.item).toEqual({ code: 404, message: 'not found', tags: ['error'] });
    expect(wi2.label).toBe('test');
    expect(Object.isFrozen(wi2)).toBe(true);
  });
});

// --- Tuple types with class/interface types ---

describe('tuple types with class/interface types', () => {
  function readGenerated(): string {
    return fs.readFileSync(
      path.join(fixturesDir, 'tuple-class-types.freezed.ts'),
      'utf-8',
    );
  }

  it('preserves [Status, string] in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('statusPair: [Status, string]');
  });

  it('preserves [Status, Wrapper<Status>] in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('twoClasses: [Status, Wrapper<Status>]');
  });

  it('preserves [Wrapper<Status>, number] in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('genericInTuple: [Wrapper<Status>, number]');
  });

  it('preserves [string, Status, number] in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('mixed: [string, Status, number]');
  });

  it('generates correct type imports in natural order', () => {
    const generated = readGenerated();
    const typeImports = generated.split('\n').filter(l =>
      l.startsWith('import type') && !l.includes('freezedts/runtime'),
    );
    expect(typeImports).toEqual([
      "import type { Status } from './status.js';",
      "import type { Wrapper } from './wrapper.js';",
    ]);
  });

  it('constructs with class-typed tuple values', async () => {
    const { TupleClassTypes } = await import('./fixtures/tuple-class-types.ts');
    const instance = new TupleClassTypes({
      statusPair: [{ code: 200, message: 'ok' }, 'success'],
      twoClasses: [
        { code: 404, message: 'not found' },
        { value: { code: 500, message: 'error' }, label: 'wrapped' },
      ],
      genericInTuple: [{ value: { code: 200, message: 'ok' }, label: 'test' }, 42],
      mixed: ['hello', { code: 301, message: 'moved' }, 99],
    });
    expect(instance.statusPair).toEqual([{ code: 200, message: 'ok' }, 'success']);
    expect(instance.twoClasses[1]).toEqual({ value: { code: 500, message: 'error' }, label: 'wrapped' });
    expect(instance.genericInTuple[0]).toEqual({ value: { code: 200, message: 'ok' }, label: 'test' });
    expect(instance.mixed[1]).toEqual({ code: 301, message: 'moved' });
    expect(Object.isFrozen(instance)).toBe(true);
  });

  it('freezes class-typed elements inside tuples', async () => {
    const { TupleClassTypes } = await import('./fixtures/tuple-class-types.ts');
    const instance = new TupleClassTypes({
      statusPair: [{ code: 200, message: 'ok' }, 'success'],
      twoClasses: [
        { code: 404, message: 'not found' },
        { value: { code: 500, message: 'error' }, label: 'wrapped' },
      ],
      genericInTuple: [{ value: { code: 200, message: 'ok' }, label: 'test' }, 42],
      mixed: ['hello', { code: 301, message: 'moved' }, 99],
    });
    expect(() => { (instance.statusPair as any)[0] = { code: 999, message: 'hacked' }; }).toThrow();
    expect(() => { (instance.statusPair[0] as any).code = 999; }).toThrow();
  });

  it('equals works with class-typed tuples', async () => {
    const { TupleClassTypes } = await import('./fixtures/tuple-class-types.ts');
    const params = {
      statusPair: [{ code: 200, message: 'ok' }, 'success'] as [any, string],
      twoClasses: [
        { code: 404, message: 'not found' },
        { value: { code: 500, message: 'error' }, label: 'wrapped' },
      ] as [any, any],
      genericInTuple: [{ value: { code: 200, message: 'ok' }, label: 'test' }, 42] as [any, number],
      mixed: ['hello', { code: 301, message: 'moved' }, 99] as [string, any, number],
    };
    const a = new TupleClassTypes(params);
    const b = new TupleClassTypes(params);
    expect(a.equals(b)).toBe(true);
  });

  it('equals detects differences in class-typed tuple elements', async () => {
    const { TupleClassTypes } = await import('./fixtures/tuple-class-types.ts');
    const base = {
      statusPair: [{ code: 200, message: 'ok' }, 'success'] as [any, string],
      twoClasses: [
        { code: 404, message: 'not found' },
        { value: { code: 500, message: 'error' }, label: 'wrapped' },
      ] as [any, any],
      genericInTuple: [{ value: { code: 200, message: 'ok' }, label: 'test' }, 42] as [any, number],
      mixed: ['hello', { code: 301, message: 'moved' }, 99] as [string, any, number],
    };
    const a = new TupleClassTypes(base);
    const b = new TupleClassTypes({
      ...base,
      statusPair: [{ code: 500, message: 'error' }, 'success'],
    });
    expect(a.equals(b)).toBe(false);
  });

  it('with() replaces tuple properties containing class types', async () => {
    const { TupleClassTypes } = await import('./fixtures/tuple-class-types.ts');
    const original = new TupleClassTypes({
      statusPair: [{ code: 200, message: 'ok' }, 'success'],
      twoClasses: [
        { code: 404, message: 'not found' },
        { value: { code: 500, message: 'error' }, label: 'wrapped' },
      ],
      genericInTuple: [{ value: { code: 200, message: 'ok' }, label: 'test' }, 42],
      mixed: ['hello', { code: 301, message: 'moved' }, 99],
    });
    const updated = original.with({
      statusPair: [{ code: 404, message: 'not found' }, 'fail'],
    });
    expect(updated.statusPair).toEqual([{ code: 404, message: 'not found' }, 'fail']);
    expect(updated.mixed).toEqual(['hello', { code: 301, message: 'moved' }, 99]);
    expect(Object.isFrozen(updated)).toBe(true);
  });
});
