import { beforeAll, describe, it, expect } from 'bun:test';
import { generate } from '../../packages/freezedts-cli/src/generator/generator.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

beforeAll(() => {
  generate([
    path.resolve('tests/import-type/fixtures/tshirt-size.ts'),
    path.resolve('tests/import-type/fixtures/person.ts'),
  ]);
});

describe('importing types', () => {
  it('person and tshirtsize are frozen', async () => {
    const { PhoneNumber } = await import('./fixtures/phonenumber.ts');
    const { Person } = await import('./fixtures/person.ts');

    const tshirtSize = 'XS';
    const phone = new PhoneNumber({ areaCode: '415', phoneNumber: '5559999' });
    const person = new Person({ name: 'Bob', tshirtSize, phone });

    expect(Object.isFrozen(person)).toBe(true);
    expect(Object.isFrozen(person.tshirtSize)).toBe(true);
  });

  it('with() replaces top-level fields', async () => {
    const { PhoneNumber } = await import('./fixtures/phonenumber.ts');
    const { Person } = await import('./fixtures/person.ts');

    const tshirtSize = 'XS';
    const phone = new PhoneNumber({ areaCode: '415', phoneNumber: '5559999' });
    const person = new Person({ name: 'Bob', tshirtSize, phone });

    const updated = person.with({ name: 'Carol', tshirtSize: 'M' });
    expect(updated.name).toBe('Carol');
    expect(updated.tshirtSize).toBe('M');
    expect(updated.phone).toBe(person.phone);
    expect(updated).not.toBe(person);
  });

  it('equals detects nested types differences', async () => {
    const { PhoneNumber } = await import('./fixtures/phonenumber.ts');
    const { Person } = await import('./fixtures/person.ts');

    const phone = new PhoneNumber({ areaCode: '303', phoneNumber: '5551111' });
    const a = new Person({
      name: 'Dan',
      tshirtSize: 'XL',
      phone,
    });
    const b = new Person({
      name: 'Dan',
      tshirtSize: 'XS',
      phone,
    });
    expect(a.equals(b)).toBe(false);
  });

  it('toString includes all fields', async () => {
    const { PhoneNumber } = await import('./fixtures/phonenumber.ts');
    const { Person } = await import('./fixtures/person.ts');

    const person = new Person({
      name: 'Fay',
      tshirtSize: 'XL',
      phone: new PhoneNumber({ areaCode: '206', phoneNumber: '5552222' }),
    });

    expect(person.toString()).toContain('Person(');
    expect(person.toString()).toContain('tshirtSize: XL');
  });

  it('imports PhoneNumber from the source file', () => {
    const generated = fs.readFileSync(
      path.resolve('tests/import-type/fixtures/person.freezed.ts'),
      'utf-8',
    );
    expect(generated).toContain("import type { PhoneNumber } from './phonenumber.js'");
  });

  it('imports type TshirtSize from the source file, not the object name', () => {
    const generated = fs.readFileSync(
      path.resolve('tests/import-type/fixtures/person.freezed.ts'),
      'utf-8',
    );
    expect(generated).toContain("import type { TshirtSize } from './tshirt-size.js'");
  });

  it('uses TshirtSize (not $TshirtSize) for property types', () => {
    const generated = fs.readFileSync(
      path.resolve('tests/import-type/fixtures/person.freezed.ts'),
      'utf-8',
    );
    expect(generated).toContain('tshirtSize: TshirtSize;');
    expect(generated).not.toContain('tshirtSize: $TshirtSize;');
  });

  it('imported class field is frozen', async () => {
    const { PhoneNumber } = await import('./fixtures/phonenumber.ts');
    const { Person } = await import('./fixtures/person.ts');
    const person = new Person({
      name: 'Alice',
      tshirtSize: 'M',
      phone: new PhoneNumber({ areaCode: '415', phoneNumber: '5559999' }),
    });
    expect(Object.isFrozen(person.phone)).toBe(true);
  });

  it('with() replaces imported class field', async () => {
    const { PhoneNumber } = await import('./fixtures/phonenumber.ts');
    const { Person } = await import('./fixtures/person.ts');
    const origPhone = new PhoneNumber({ areaCode: '415', phoneNumber: '5559999' });
    const person = new Person({ name: 'Bob', tshirtSize: 'L', phone: origPhone });
    const p2 = person.with({ phone: new PhoneNumber({ areaCode: '555', phoneNumber: '1234' }) });
    expect(p2.phone.areaCode).toBe('555');
    expect(person.phone.areaCode).toBe('415');
  });

  it('equals detects imported class field difference', async () => {
    const { PhoneNumber } = await import('./fixtures/phonenumber.ts');
    const { Person } = await import('./fixtures/person.ts');
    const a = new Person({
      name: 'Dan', tshirtSize: 'XL',
      phone: new PhoneNumber({ areaCode: '303', phoneNumber: '5551111' }),
    });
    const b = new Person({
      name: 'Dan', tshirtSize: 'XL',
      phone: new PhoneNumber({ areaCode: '415', phoneNumber: '5551111' }),
    });
    expect(a.equals(b)).toBe(false);
  });

  it('equals returns true when imported class fields are structurally equal', async () => {
    const { PhoneNumber } = await import('./fixtures/phonenumber.ts');
    const { Person } = await import('./fixtures/person.ts');
    const a = new Person({
      name: 'Eve', tshirtSize: 'S',
      phone: new PhoneNumber({ areaCode: '206', phoneNumber: '5552222' }),
    });
    const b = new Person({
      name: 'Eve', tshirtSize: 'S',
      phone: new PhoneNumber({ areaCode: '206', phoneNumber: '5552222' }),
    });
    expect(a.equals(b)).toBe(true);
  });
});
