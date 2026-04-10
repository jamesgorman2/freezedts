import { beforeAll, describe, it, expect } from 'bun:test';
import { generate } from '../../packages/freezedts-cli/src/generator/generator.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

beforeAll(() => {
  generate([
    path.resolve('tests/generic-class-imports/fixtures/container.ts'),
  ]);
});

describe('importing generic class types (not just interfaces)', () => {
  function readGenerated(): string {
    return fs.readFileSync(
      path.resolve('tests/generic-class-imports/fixtures/container.freezed.ts'),
      'utf-8',
    );
  }

  it('imports the outer generic class type', () => {
    const generated = readGenerated();
    expect(generated).toContain("import type { Wrapper } from './wrapper.js';");
  });

  it('imports the generic type parameter class', () => {
    const generated = readGenerated();
    expect(generated).toContain("import type { Item } from './item.js';");
  });

  it('imports multi-param generic class', () => {
    const generated = readGenerated();
    expect(generated).toContain("import type { Pair } from './pair.js';");
  });

  it('imports nested generic class Box<T>', () => {
    const generated = readGenerated();
    expect(generated).toContain("import type { Box } from './box.js';");
  });

  it('preserves Wrapper<Item> in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('wrapped: Wrapper<Item>');
  });

  it('preserves Wrapper<Item>[] in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('items: Wrapper<Item>[]');
  });

  it('preserves Pair<Item, string> in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('pair: Pair<Item, string>');
  });

  it('preserves Wrapper<Box<Item>> in property declarations', () => {
    const generated = readGenerated();
    expect(generated).toContain('nested: Wrapper<Box<Item>>');
  });

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

  it('uses import type for all generated imports', () => {
    const generated = readGenerated();
    const importLines = generated.split('\n').filter(l =>
      l.startsWith('import ') && l.includes('from') && !l.includes('freezedts/runtime'),
    );
    for (const line of importLines) {
      expect(line).toMatch(/^import type \{/);
    }
  });
});

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
