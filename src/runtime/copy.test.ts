import { describe, it, expect } from 'bun:test';
import { createWithProxy, isFreezedInstance } from './copy.js';
import { FREEZED_OPTIONS } from './freezed.js';

// Helper: minimal mock of a @freezed class
function mockFreezed(name: string) {
  const Cls = class {
    constructor(params: Record<string, unknown>) {
      Object.assign(this, params);
      Object.freeze(this);
    }
  };
  Object.defineProperty(Cls, 'name', { value: name });
  (Cls as any)[FREEZED_OPTIONS] = {};
  return Cls as new (params: Record<string, unknown>) => any;
}

describe('isFreezedInstance', () => {
  it('returns true for @freezed class instances', () => {
    const Cls = mockFreezed('Foo');
    expect(isFreezedInstance(new Cls({ x: 1 }))).toBe(true);
  });

  it('returns false for plain objects', () => {
    expect(isFreezedInstance({ x: 1 })).toBe(false);
  });

  it('returns false for null and undefined', () => {
    expect(isFreezedInstance(null)).toBe(false);
    expect(isFreezedInstance(undefined)).toBe(false);
  });

  it('returns false for primitives', () => {
    expect(isFreezedInstance(42)).toBe(false);
    expect(isFreezedInstance('hi')).toBe(false);
  });
});

describe('createWithProxy — shallow', () => {
  it('creates a new instance with overrides when called directly', () => {
    const Person = mockFreezed('Person');
    const p = new Person({ name: 'John', age: 30 });
    const proxy = createWithProxy(p);
    const p2 = proxy({ name: 'Jane' });
    expect(p2.name).toBe('Jane');
    expect(p2.age).toBe(30);
    expect(Object.isFrozen(p2)).toBe(true);
    expect(p2).not.toBe(p);
  });

  it('preserves all properties when overrides is empty', () => {
    const Cls = mockFreezed('Cls');
    const c = new Cls({ a: 1, b: 2 });
    const c2 = createWithProxy(c)({});
    expect(c2.a).toBe(1);
    expect(c2.b).toBe(2);
    expect(c2).not.toBe(c);
  });
});

describe('createWithProxy — deep 1 level', () => {
  it('updates a nested @freezed property via proxy chain', () => {
    const Inner = mockFreezed('Inner');
    const Outer = mockFreezed('Outer');
    const inner = new Inner({ value: 'hello' });
    const outer = new Outer({ name: 'test', inner });
    const result = createWithProxy(outer).inner({ value: 'world' });
    expect(result.name).toBe('test');
    expect(result.inner.value).toBe('world');
    expect(result).not.toBe(outer);
    expect(result.inner).not.toBe(inner);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.inner)).toBe(true);
  });

  it('does not modify the original instance', () => {
    const Inner = mockFreezed('Inner');
    const Outer = mockFreezed('Outer');
    const inner = new Inner({ value: 'hello' });
    const outer = new Outer({ name: 'test', inner });
    createWithProxy(outer).inner({ value: 'world' });
    expect(outer.inner.value).toBe('hello');
  });
});

describe('createWithProxy — deep 2 levels', () => {
  it('updates a deeply nested @freezed property', () => {
    const Leaf = mockFreezed('Leaf');
    const Mid = mockFreezed('Mid');
    const Root = mockFreezed('Root');
    const leaf = new Leaf({ x: 1 });
    const mid = new Mid({ y: 2, leaf });
    const root = new Root({ z: 3, mid });
    const result = createWithProxy(root).mid.leaf({ x: 99 });
    expect(result.z).toBe(3);
    expect(result.mid.y).toBe(2);
    expect(result.mid.leaf.x).toBe(99);
    expect(result).not.toBe(root);
    expect(result.mid).not.toBe(mid);
    expect(result.mid.leaf).not.toBe(leaf);
  });
});

describe('createWithProxy — edge cases', () => {
  it('returns undefined for non-freezed property access on proxy', () => {
    const Cls = mockFreezed('Cls');
    const c = new Cls({ name: 'test', count: 42 });
    const proxy = createWithProxy(c);
    expect(proxy.name).toBeUndefined();
    expect(proxy.count).toBeUndefined();
  });

  it('returns undefined for non-string property access', () => {
    const Cls = mockFreezed('Cls');
    const c = new Cls({ x: 1 });
    const proxy = createWithProxy(c);
    expect(proxy[Symbol.toPrimitive]).toBeUndefined();
  });
});
