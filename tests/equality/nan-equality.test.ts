import { beforeAll, describe, it, expect } from 'bun:test';
import { generate } from '../../packages/freezedts-cli/src/generator/generator.js';
import * as path from 'node:path';

beforeAll(() => {
  generate([path.resolve('tests/equality/fixtures/nan-equality.ts')]);
});

describe('NaN equality', () => {
  it('equals returns true when both have NaN in the same field', async () => {
    const { Measurement } = await import('./fixtures/nan-equality.ts');
    const a = new Measurement({ label: 'x', value: NaN });
    const b = new Measurement({ label: 'x', value: NaN });
    expect(a.equals(b)).toBe(true);
  });

  it('equals returns false when only one has NaN', async () => {
    const { Measurement } = await import('./fixtures/nan-equality.ts');
    const a = new Measurement({ label: 'x', value: NaN });
    const b = new Measurement({ label: 'x', value: 42 });
    expect(a.equals(b)).toBe(false);
  });

  it('equals still works for normal numbers', async () => {
    const { Measurement } = await import('./fixtures/nan-equality.ts');
    const a = new Measurement({ label: 'x', value: 3.14 });
    const b = new Measurement({ label: 'x', value: 3.14 });
    expect(a.equals(b)).toBe(true);
  });
});
