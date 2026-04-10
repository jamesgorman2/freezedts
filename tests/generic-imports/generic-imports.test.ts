import { beforeAll, describe, it, expect } from 'bun:test';
import { generate } from '../../packages/freezedts-cli/src/generator/generator.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

beforeAll(() => {
  generate([
    path.resolve('tests/generic-imports/fixtures/container.ts'),
  ]);
});

describe('importing generic types', () => {
  function readGenerated(): string {
    return fs.readFileSync(
      path.resolve('tests/generic-imports/fixtures/container.freezed.ts'),
      'utf-8',
    );
  }

  // --- A<B> ---

  it('imports the outer generic type', () => {
    const generated = readGenerated();
    expect(generated).toContain("import type { Wrapper } from './wrapper.js';");
  });

  it('imports the generic type parameter', () => {
    const generated = readGenerated();
    expect(generated).toContain("import type { Item } from './item.js';");
  });

  it('preserves A<B> in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('wrapped: Wrapper<Item>');
  });

  it('preserves A<B>[] in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('items: Wrapper<Item>[]');
  });

  // --- A<B, C> ---

  it('imports the multi-param generic type', () => {
    const generated = readGenerated();
    expect(generated).toContain("import type { Pair } from './pair.js';");
  });

  it('imports both type parameters of A<B, C>', () => {
    const generated = readGenerated();
    expect(generated).toContain("import type { Item } from './item.js';");
    expect(generated).toContain("import type { Tag } from './tag.js';");
  });

  it('preserves A<B, C> in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('pair: Pair<Item, Tag>');
  });

  // --- A<B<C>> ---

  it('imports all types from nested generics A<B<C>>', () => {
    const generated = readGenerated();
    expect(generated).toContain("import type { Wrapper } from './wrapper.js';");
    expect(generated).toContain("import type { Box } from './box.js';");
    expect(generated).toContain("import type { Item } from './item.js';");
  });

  it('preserves A<B<C>> in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('nested: Wrapper<Box<Item>>');
  });

  // --- A<B<C>, D> ---

  it('imports all types from A<B<C>, D>', () => {
    const generated = readGenerated();
    expect(generated).toContain("import type { Pair } from './pair.js';");
    expect(generated).toContain("import type { Box } from './box.js';");
    expect(generated).toContain("import type { Item } from './item.js';");
    expect(generated).toContain("import type { Tag } from './tag.js';");
  });

  it('preserves A<B<C>, D> in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('complex: Pair<Box<Item>, Tag>');
  });

  // --- import hygiene ---

  it('never puts angle brackets in import symbols', () => {
    const generated = readGenerated();
    const importLines = generated.split('\n').filter(l =>
      l.startsWith('import type') && l.includes('from'),
    );
    for (const line of importLines) {
      const braceContent = line.match(/\{([^}]+)\}/)?.[1] ?? '';
      expect(braceContent).not.toContain('<');
      expect(braceContent).not.toContain('>');
    }
  });
});

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
