import { describe, it, expect, beforeAll } from 'bun:test';
import * as path from 'node:path';
import { generate } from '../../packages/freezedts-cli/src/generator/generator.js';

const fixturesDir = path.resolve(import.meta.dirname, 'fixtures');

beforeAll(() => {
  generate([
    path.join(fixturesDir, 'defaults.ts'),
    path.join(fixturesDir, 'assertions.ts'),
    path.join(fixturesDir, 'mixed.ts'),
    path.join(fixturesDir, 'with-import-defaults.ts'),
    path.join(fixturesDir, 'with-import-assertions.ts'),
  ]);
});

describe('field config — defaults', () => {
  it('applies default when param is omitted', async () => {
    const { Counter } = await import('./fixtures/defaults.ts');
    const c = new Counter({ name: 'test' });
    expect(c.count).toBe(0);
    expect(c.label).toBe('untitled');
  });

  it('uses provided value over default', async () => {
    const { Counter } = await import('./fixtures/defaults.ts');
    const c = new Counter({ name: 'test', count: 5, label: 'hello' });
    expect(c.count).toBe(5);
    expect(c.label).toBe('hello');
  });

  it('applies defaults independently per field', async () => {
    const { Counter } = await import('./fixtures/defaults.ts');
    const c = new Counter({ name: 'test', count: 10 });
    expect(c.count).toBe(10);
    expect(c.label).toBe('untitled');
  });

  it('with() preserves current value when override omitted', async () => {
    const { Counter } = await import('./fixtures/defaults.ts');
    const c1 = new Counter({ name: 'test', count: 5 });
    const c2 = c1.with({ name: 'updated' });
    expect(c2.count).toBe(5);
    expect(c2.label).toBe('untitled');
  });

  it('with({ field: undefined }) reapplies default', async () => {
    const { Counter } = await import('./fixtures/defaults.ts');
    const c1 = new Counter({ name: 'test', count: 5 });
    const c2 = c1.with({ count: undefined });
    expect(c2.count).toBe(0);
  });
});

describe('field config — assertions', () => {
  it('allows construction with valid values', async () => {
    const { Email } = await import('./fixtures/assertions.ts');
    const e = new Email({ address: 'a@b.com', subject: 'hi', body: 'hello' });
    expect(e.address).toBe('a@b.com');
    expect(e.subject).toBe('hi');
    expect(e.body).toBe('hello');
  });

  it('throws with custom message on assertion failure', async () => {
    const { Email } = await import('./fixtures/assertions.ts');
    expect(
      () => new Email({ address: 'invalid', subject: 'hi', body: 'hello' }),
    ).toThrow('invalid email address');
  });

  it('throws with ClassName.field when no custom message', async () => {
    const { Email } = await import('./fixtures/assertions.ts');
    expect(
      () => new Email({ address: 'a@b.com', subject: '', body: 'hello' }),
    ).toThrow("Assertion failed for 'Email.subject'");
  });

  it('default is applied before assertion runs', async () => {
    const { Config } = await import('./fixtures/mixed.ts');
    const c = new Config({ name: 'test' });
    expect(c.port).toBe(3000);
    expect(c.host).toBe('localhost');
  });

  it('with() that violates assertion throws', async () => {
    const { Email } = await import('./fixtures/assertions.ts');
    const e = new Email({ address: 'a@b.com', subject: 'hi', body: 'hello' });
    expect(() => e.with({ address: 'invalid' })).toThrow(
      'invalid email address',
    );
  });
});

describe('field config — regression', () => {
  it('class without field config still works', async () => {
    const { Simple } = await import('./fixtures/defaults.ts');
    const s = new Simple({ value: 'hello' });
    expect(s.value).toBe('hello');
    expect(Object.isFrozen(s)).toBe(true);
  });
});

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
