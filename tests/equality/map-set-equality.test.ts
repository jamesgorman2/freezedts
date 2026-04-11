import { beforeAll, describe, it, expect } from 'bun:test';
import { generate } from '../../packages/freezedts-cli/src/generator/generator.js';
import * as path from 'node:path';

beforeAll(() => {
  generate([
    path.resolve('tests/equality/fixtures/map-set-equality.ts'),
    path.resolve('tests/equality/fixtures/map-set-imported.ts'),
  ]);
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
