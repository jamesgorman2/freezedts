import { beforeAll, describe, it, expect } from 'bun:test';
import { generate } from '../../packages/freezedts-cli/src/generator/generator.js';
import type { CheckStatus, StatusContainer } from './fixtures/readiness-checks.ts';
import * as fs from 'node:fs';
import * as path from 'node:path';

beforeAll(() => {
  generate([
    path.resolve('tests/colocated-imports/fixtures/readiness-checks.ts'),
  ]);
});

describe('arrays, unions, and transitive types in imports', () => {
  function readGenerated(): string {
    return fs.readFileSync(
      path.resolve('tests/colocated-imports/fixtures/readiness-checks.freezed.ts'),
      'utf-8',
    );
  }

  it('can use type export', async () => {
    const { ReadinessChecks, StatusClass } = await import('./fixtures/readiness-checks.ts');
    const db: CheckStatus = "ok";
    const auth: StatusContainer = { s: "ok" };
    const pubsub = new StatusClass();
    const rc = new ReadinessChecks({db, auth, pubsub});

    expect(rc.db).toBe(db)
    expect(rc.auth).toBe(auth)
    expect(rc.pubsub).toBe(pubsub)
  });

  it('imports the local types to the generated file', () => {
    const generated = readGenerated();
    expect(generated).toContain("import { type CheckStatus, type StatusContainer, StatusClass } from './readiness-checks.js';");
  });

  it('does not import transitively to the generated file', () => {
    const generated = readGenerated();

    expect(generated).not.toMatch(/^import (type )?\{.*InnerClass/m);
    expect(generated).not.toMatch(/^import (type )?\{.*InnerInterface/m);
    expect(generated).not.toMatch(/^import (type )?\{.*InnerType/m);
  });

  it('property types match in the  generated file', () => {
    const generated = readGenerated();

    expect(generated).toContain('db: CheckStatus');
    expect(generated).toContain('auth: StatusContainer');
    expect(generated).toContain('pubsub: StatusClass');
  });
});
