import { beforeAll, describe, it, expect } from 'bun:test';
import { generate } from '../../packages/freezedts-cli/src/generator/generator.js';
import * as path from 'node:path';

beforeAll(() => {
  generate([path.resolve('tests/equality/fixtures/nullable-freezed.ts')]);
});

describe('nullable @freezed property equality', () => {
  it('equals returns true when both have undefined optional freezed prop', async () => {
    const { Item } = await import('./fixtures/nullable-freezed.ts');
    const a = new Item({ name: 'x' });
    const b = new Item({ name: 'x' });
    expect(a.equals(b)).toBe(true);
  });

  it('equals returns false when one has a tag and the other does not', async () => {
    const { Tag, Item } = await import('./fixtures/nullable-freezed.ts');
    const a = new Item({ name: 'x', tag: new Tag({ label: 'a' }) });
    const b = new Item({ name: 'x' });
    expect(a.equals(b)).toBe(false);
  });

  it('equals returns true when both have equal tags', async () => {
    const { Tag, Item } = await import('./fixtures/nullable-freezed.ts');
    const a = new Item({ name: 'x', tag: new Tag({ label: 'a' }) });
    const b = new Item({ name: 'x', tag: new Tag({ label: 'a' }) });
    expect(a.equals(b)).toBe(true);
  });

  it('does not throw when comparing with undefined tag', async () => {
    const { Tag, Item } = await import('./fixtures/nullable-freezed.ts');
    const a = new Item({ name: 'x' });
    const b = new Item({ name: 'x', tag: new Tag({ label: 'b' }) });
    expect(() => a.equals(b)).not.toThrow();
    expect(a.equals(b)).toBe(false);
  });
});
