import { describe, it, expect, beforeAll } from 'bun:test';
import * as path from 'node:path';
import { generate } from '../../packages/freezedts-cli/src/generator/generator.js';

const fixturesDir = path.resolve(import.meta.dirname, 'fixtures');

beforeAll(() => {
  generate([
    path.join(fixturesDir, 'defaults.ts'),
    path.join(fixturesDir, 'assertions.ts'),
    path.join(fixturesDir, 'mixed.ts'),
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
