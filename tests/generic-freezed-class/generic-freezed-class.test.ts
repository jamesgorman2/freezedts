import { beforeAll, describe, it, expect } from 'bun:test';
import { generate } from '../../packages/freezedts-cli/src/generator/generator.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

beforeAll(() => {
  generate([
    path.resolve('tests/generic-freezed-class/fixtures/simple-generic.ts'),
    path.resolve('tests/generic-freezed-class/fixtures/constrained.ts'),
    path.resolve('tests/generic-freezed-class/fixtures/property-accessor.ts'),
    path.resolve('tests/generic-freezed-class/fixtures/with-complex-generics.ts'),
    path.resolve('tests/generic-freezed-class/fixtures/generic-with-defaults.ts'),
  ]);
});

describe('@freezed class with simple generic <T>', () => {
  function readGenerated(): string {
    return fs.readFileSync(
      path.resolve('tests/generic-freezed-class/fixtures/simple-generic.freezed.ts'),
      'utf-8',
    );
  }

  it('generates without errors', () => {
    const result = generate([
      path.resolve('tests/generic-freezed-class/fixtures/simple-generic.ts'),
    ]);
    expect(result.errors).toHaveLength(0);
  });

  it('preserves T in property type', () => {
    const generated = readGenerated();
    expect(generated).toContain('value: T');
  });

  it('preserves T in Params type', () => {
    const generated = readGenerated();
    expect(generated).toContain('value: T;');
  });

  it('constructs with a number value', async () => {
    const { SimpleGeneric } = await import('./fixtures/simple-generic.ts');
    const s = new SimpleGeneric<number>({ value: 42, label: 'test' });
    expect(s.value).toBe(42);
    expect(s.label).toBe('test');
    expect(Object.isFrozen(s)).toBe(true);
  });

  it('constructs with a string value', async () => {
    const { SimpleGeneric } = await import('./fixtures/simple-generic.ts');
    const s = new SimpleGeneric<string>({ value: 'hello', label: 'greeting' });
    expect(s.value).toBe('hello');
  });

  it('constructs with an object value', async () => {
    const { SimpleGeneric } = await import('./fixtures/simple-generic.ts');
    const s = new SimpleGeneric({ value: { x: 1, y: 2 }, label: 'point' });
    expect(s.value).toEqual({ x: 1, y: 2 });
  });

  it('equals works across generic instances', async () => {
    const { SimpleGeneric } = await import('./fixtures/simple-generic.ts');
    const a = new SimpleGeneric({ value: 42, label: 'x' });
    const b = new SimpleGeneric({ value: 42, label: 'x' });
    const c = new SimpleGeneric({ value: 99, label: 'x' });
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });

  it('with() works on generic class', async () => {
    const { SimpleGeneric } = await import('./fixtures/simple-generic.ts');
    const s1 = new SimpleGeneric({ value: 'a', label: 'x' });
    const s2 = s1.with({ label: 'y' });
    expect(s2.value).toBe('a');
    expect(s2.label).toBe('y');
    expect(s2).not.toBe(s1);
  });

  it('abstract class declaration includes <T> type parameter', () => {
    const generated = readGenerated();
    expect(generated).toContain("export abstract class $SimpleGeneric<T>");
  });

  it('Params type includes <T> type parameter', () => {
    const generated = readGenerated();
    expect(generated).toContain("export type SimpleGenericParams<T> =");
  });

  it('With type references parameterized Params', () => {
    const generated = readGenerated();
    expect(generated).toContain('Partial<SimpleGenericParams<T>>');
  });

  it('constructor parameter uses parameterized Params type', () => {
    const generated = readGenerated();
    expect(generated).toContain("constructor(params: SimpleGenericParams<T>)");
  });

  it('does not generate type imports for unconstrained generic', () => {
    const generated = readGenerated();
    const typeImports = generated.split('\n').filter(l =>
      l.startsWith('import type') && !l.includes('freezedts/runtime'),
    );
    expect(typeImports).toEqual([]);
  });

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

  it('With type declaration includes T parameter', () => {
    const generated = readGenerated();
    expect(generated).toContain('export type SimpleGenericWith<T, Self> = {');
  });

  it('get with() return type includes T parameter', () => {
    const generated = readGenerated();
    expect(generated).toContain('get with(): SimpleGenericWith<T, this>');
  });
});

describe('@freezed class with constrained generic <T extends Identifiable>', () => {
  function readGenerated(): string {
    return fs.readFileSync(
      path.resolve('tests/generic-freezed-class/fixtures/constrained.freezed.ts'),
      'utf-8',
    );
  }

  it('generates without errors', () => {
    const result = generate([
      path.resolve('tests/generic-freezed-class/fixtures/constrained.ts'),
    ]);
    expect(result.errors).toHaveLength(0);
  });

  it('preserves T in property type', () => {
    const generated = readGenerated();
    expect(generated).toContain('item: T');
  });

  it('constructs with an Identifiable-shaped object', async () => {
    const { Constrained } = await import('./fixtures/constrained.ts');
    const c = new Constrained({ item: { id: 'abc' }, count: 3 });
    expect(c.item).toEqual({ id: 'abc' });
    expect(c.count).toBe(3);
    expect(Object.isFrozen(c)).toBe(true);
  });

  it('equals works on constrained generic', async () => {
    const { Constrained } = await import('./fixtures/constrained.ts');
    const a = new Constrained({ item: { id: 'x' }, count: 1 });
    const b = new Constrained({ item: { id: 'x' }, count: 1 });
    expect(a.equals(b)).toBe(true);
  });

  it('abstract class declaration includes <T extends Identifiable> type parameter', () => {
    const generated = readGenerated();
    expect(generated).toContain("export abstract class $Constrained<T extends Identifiable>");
  });

  it('Params type includes <T extends Identifiable> type parameter', () => {
    const generated = readGenerated();
    expect(generated).toContain("export type ConstrainedParams<T extends Identifiable> =");
  });

  it('With type references parameterized Params', () => {
    const generated = readGenerated();
    expect(generated).toContain('Partial<ConstrainedParams<T>>');
  });

  it('constructor parameter uses parameterized Params type', () => {
    const generated = readGenerated();
    expect(generated).toContain("constructor(params: ConstrainedParams<T>)");
  });

  it('imports Identifiable for the type constraint', () => {
    const generated = readGenerated();
    const typeImports = generated.split('\n').filter(l =>
      l.startsWith('import type') && !l.includes('freezedts/runtime'),
    );
    expect(typeImports).toEqual([
      "import type { Identifiable } from './bound.js';",
    ]);
  });

  it('With type declaration includes constrained T parameter', () => {
    const generated = readGenerated();
    expect(generated).toContain('export type ConstrainedWith<T extends Identifiable, Self> = {');
  });

  it('get with() return type uses T name without constraint', () => {
    const generated = readGenerated();
    expect(generated).toContain('get with(): ConstrainedWith<T, this>');
  });
});

describe('@freezed class with <Type, Key extends keyof Type>', () => {
  function readGenerated(): string {
    return fs.readFileSync(
      path.resolve('tests/generic-freezed-class/fixtures/property-accessor.freezed.ts'),
      'utf-8',
    );
  }

  it('generates without errors', () => {
    const result = generate([
      path.resolve('tests/generic-freezed-class/fixtures/property-accessor.ts'),
    ]);
    expect(result.errors).toHaveLength(0);
  });

  it('preserves Type in property type', () => {
    const generated = readGenerated();
    expect(generated).toContain('source: Type');
  });

  it('preserves Key in property type', () => {
    const generated = readGenerated();
    expect(generated).toContain('key: Key');
  });

  it('constructs with keyof-typed property', async () => {
    const { PropertyAccessor } = await import('./fixtures/property-accessor.ts');
    const pa = new PropertyAccessor({
      source: { name: 'Alice', age: 30 },
      key: 'name',
    });
    expect(pa.source).toEqual({ name: 'Alice', age: 30 });
    expect(pa.key).toBe('name');
    expect(Object.isFrozen(pa)).toBe(true);
  });

  it('equals works on keyof generic', async () => {
    const { PropertyAccessor } = await import('./fixtures/property-accessor.ts');
    const a = new PropertyAccessor({ source: { x: 1 }, key: 'x' });
    const b = new PropertyAccessor({ source: { x: 1 }, key: 'x' });
    expect(a.equals(b)).toBe(true);
  });

  it('abstract class declaration includes <Type, Key extends keyof Type> type parameters', () => {
    const generated = readGenerated();
    expect(generated).toContain("export abstract class $PropertyAccessor<Type, Key extends keyof Type>");
  });

  it('Params type includes <Type, Key extends keyof Type> type parameters', () => {
    const generated = readGenerated();
    expect(generated).toContain("export type PropertyAccessorParams<Type, Key extends keyof Type> =");
  });

  it('With type references parameterized Params', () => {
    const generated = readGenerated();
    expect(generated).toContain('Partial<PropertyAccessorParams<Type, Key>>');
  });

  it('constructor parameter uses parameterized Params type', () => {
    const generated = readGenerated();
    expect(generated).toContain("constructor(params: PropertyAccessorParams<Type, Key>)");
  });

  it('does not generate type imports for keyof constraint', () => {
    const generated = readGenerated();
    const typeImports = generated.split('\n').filter(l =>
      l.startsWith('import type') && !l.includes('freezedts/runtime'),
    );
    expect(typeImports).toEqual([]);
  });

  it('With type declaration includes both type parameters with constraints', () => {
    const generated = readGenerated();
    expect(generated).toContain('export type PropertyAccessorWith<Type, Key extends keyof Type, Self> = {');
  });

  it('get with() return type uses parameter names without constraints', () => {
    const generated = readGenerated();
    expect(generated).toContain('get with(): PropertyAccessorWith<Type, Key, this>');
  });
});

describe('@freezed class with complex generics <T extends U, Items extends T[]>', () => {
  function readGenerated(): string {
    return fs.readFileSync(
      path.resolve('tests/generic-freezed-class/fixtures/with-complex-generics.freezed.ts'),
      'utf-8',
    );
  }

  it('generates without errors', () => {
    const result = generate([
      path.resolve('tests/generic-freezed-class/fixtures/with-complex-generics.ts'),
    ]);
    expect(result.errors).toHaveLength(0);
  });

  it('preserves Items in property type', () => {
    const generated = readGenerated();
    expect(generated).toContain('items: Items');
  });

  it('preserves T in property type', () => {
    const generated = readGenerated();
    expect(generated).toContain('primary: T');
  });

  it('constructs with complex generic arguments', async () => {
    const { WithComplexGenerics } = await import('./fixtures/with-complex-generics.ts');
    const wc = new WithComplexGenerics({
      items: [{ id: 'a' }, { id: 'b' }],
      primary: { id: 'a' },
      label: 'group',
    });
    expect(wc.items).toEqual([{ id: 'a' }, { id: 'b' }]);
    expect(wc.primary).toEqual({ id: 'a' });
    expect(wc.label).toBe('group');
    expect(Object.isFrozen(wc)).toBe(true);
  });

  it('equals works on complex generic class', async () => {
    const { WithComplexGenerics } = await import('./fixtures/with-complex-generics.ts');
    const params = {
      items: [{ id: 'x' }],
      primary: { id: 'x' },
      label: 'test',
    };
    const a = new WithComplexGenerics(params);
    const b = new WithComplexGenerics(params);
    expect(a.equals(b)).toBe(true);
  });

  it('with() works on complex generic class', async () => {
    const { WithComplexGenerics } = await import('./fixtures/with-complex-generics.ts');
    const wc1 = new WithComplexGenerics({
      items: [{ id: 'x' }],
      primary: { id: 'x' },
      label: 'a',
    });
    const wc2 = wc1.with({ label: 'b' });
    expect(wc2.label).toBe('b');
    expect(wc2.items).toEqual(wc1.items);
    expect(wc2).not.toBe(wc1);
  });

  it('abstract class declaration includes <T extends Identifiable, Items extends T[]> type parameters', () => {
    const generated = readGenerated();
    expect(generated).toContain("export abstract class $WithComplexGenerics<T extends Identifiable, Items extends T[]>");
  });

  it('Params type includes <T extends Identifiable, Items extends T[]> type parameters', () => {
    const generated = readGenerated();
    expect(generated).toContain("export type WithComplexGenericsParams<T extends Identifiable, Items extends T[]> =");
  });

  it('With type references parameterized Params', () => {
    const generated = readGenerated();
    expect(generated).toContain('Partial<WithComplexGenericsParams<T, Items>>');
  });

  it('constructor parameter uses parameterized Params type', () => {
    const generated = readGenerated();
    expect(generated).toContain("constructor(params: WithComplexGenericsParams<T, Items>)");
  });

  it('imports Identifiable for the type constraint', () => {
    const generated = readGenerated();
    const typeImports = generated.split('\n').filter(l =>
      l.startsWith('import type') && !l.includes('freezedts/runtime'),
    );
    expect(typeImports).toEqual([
      "import type { Identifiable } from './bound.js';",
    ]);
  });

  it('With type declaration includes all constrained parameters', () => {
    const generated = readGenerated();
    expect(generated).toContain('export type WithComplexGenericsWith<T extends Identifiable, Items extends T[], Self> = {');
  });

  it('get with() return type uses parameter names without constraints', () => {
    const generated = readGenerated();
    expect(generated).toContain('get with(): WithComplexGenericsWith<T, Items, this>');
  });
});

describe('@freezed class with generic <T> and field config defaults', () => {
  function readGenerated(): string {
    return fs.readFileSync(
      path.resolve('tests/generic-freezed-class/fixtures/generic-with-defaults.freezed.ts'),
      'utf-8',
    );
  }

  it('generates without errors', () => {
    const result = generate([
      path.resolve('tests/generic-freezed-class/fixtures/generic-with-defaults.ts'),
    ]);
    expect(result.errors).toHaveLength(0);
  });

  it('Params type includes <T> type parameter', () => {
    const generated = readGenerated();
    expect(generated).toContain('export type GenericWithDefaultsParams<T> =');
  });

  it('abstract class includes <T> type parameter', () => {
    const generated = readGenerated();
    expect(generated).toContain('export abstract class $GenericWithDefaults<T>');
  });

  it('resolved cast uses parameterized Params type', () => {
    const generated = readGenerated();
    expect(generated).toContain('Required<GenericWithDefaultsParams<T>>');
  });

  it('applies default when param is omitted', async () => {
    const { GenericWithDefaults } = await import('./fixtures/generic-with-defaults.ts');
    const g = new GenericWithDefaults({ value: 'hello' });
    expect(g.value).toBe('hello');
    expect(g.count).toBe(0);
  });

  it('uses provided value over default', async () => {
    const { GenericWithDefaults } = await import('./fixtures/generic-with-defaults.ts');
    const g = new GenericWithDefaults({ value: 'hello', count: 5 });
    expect(g.count).toBe(5);
  });

  it('with() preserves defaulted value', async () => {
    const { GenericWithDefaults } = await import('./fixtures/generic-with-defaults.ts');
    const g1 = new GenericWithDefaults({ value: 'a', count: 3 });
    const g2 = g1.with({ value: 'b' });
    expect(g2.value).toBe('b');
    expect(g2.count).toBe(3);
  });
});
