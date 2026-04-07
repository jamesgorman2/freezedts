import { beforeAll, describe, it, expect } from 'bun:test';
import { generate } from '../../src/generator/generator.js';
import * as path from 'node:path';

beforeAll(() => {
  generate([path.resolve('tests/equality/fixtures/map-set-equality.ts')]);
});

describe('Map/Set equality', () => {
  it('equals returns true for Maps with same entries', async () => {
    const { ScoreBoard } = await import('./fixtures/map-set-equality.ts');
    const a = new ScoreBoard({ scores: new Map([['math', 100]]), tags: new Set(['a']) });
    const b = new ScoreBoard({ scores: new Map([['math', 100]]), tags: new Set(['a']) });
    expect(a.equals(b)).toBe(true);
  });

  it('equals returns false for Maps with different values', async () => {
    const { ScoreBoard } = await import('./fixtures/map-set-equality.ts');
    const a = new ScoreBoard({ scores: new Map([['math', 100]]), tags: new Set(['a']) });
    const b = new ScoreBoard({ scores: new Map([['math', 50]]), tags: new Set(['a']) });
    expect(a.equals(b)).toBe(false);
  });

  it('equals returns false for Maps with different keys', async () => {
    const { ScoreBoard } = await import('./fixtures/map-set-equality.ts');
    const a = new ScoreBoard({ scores: new Map([['math', 100]]), tags: new Set(['a']) });
    const b = new ScoreBoard({ scores: new Map([['art', 100]]), tags: new Set(['a']) });
    expect(a.equals(b)).toBe(false);
  });

  it('equals returns false for Sets with different members', async () => {
    const { ScoreBoard } = await import('./fixtures/map-set-equality.ts');
    const a = new ScoreBoard({ scores: new Map(), tags: new Set(['x', 'y']) });
    const b = new ScoreBoard({ scores: new Map(), tags: new Set(['x', 'z']) });
    expect(a.equals(b)).toBe(false);
  });

  it('equals returns false for Maps with different size', async () => {
    const { ScoreBoard } = await import('./fixtures/map-set-equality.ts');
    const a = new ScoreBoard({ scores: new Map([['a', 1], ['b', 2]]), tags: new Set() });
    const b = new ScoreBoard({ scores: new Map([['a', 1]]), tags: new Set() });
    expect(a.equals(b)).toBe(false);
  });
});
