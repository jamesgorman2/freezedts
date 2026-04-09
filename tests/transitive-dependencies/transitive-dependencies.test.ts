import { beforeAll, describe, it, expect } from 'bun:test';
import { generate } from '../../src/generator/generator.js';
import * as path from 'node:path';

beforeAll(() => {
  generate([
    path.resolve('tests/transitive-dependencies/fixtures/address.ts'),
    path.resolve('tests/transitive-dependencies/fixtures/person.ts'),
  ]);
});

describe('mixed freezed and non-freezed imports', () => {
  it('creates a person with a freezed address and non-freezed phone', async () => {
    const { Address } = await import('./fixtures/address.ts');
    const { PhoneNumber } = await import('./fixtures/phonenumber.ts');
    const { Person } = await import('./fixtures/person.ts');

    const addr = new Address({ street: '123 Main St', state: 'NY' });
    const phone = new PhoneNumber({ areaCode: '212', phoneNumber: '5551234' });
    const person = new Person({ name: 'Alice', address: addr, phone });

    expect(person.name).toBe('Alice');
    expect(person.address.street).toBe('123 Main St');
    expect(person.address.state).toBe('NY');
    expect(person.phone.areaCode).toBe('212');
    expect(person.phone.phoneNumber).toBe('5551234');
  });

  it('person and address are frozen', async () => {
    const { Address } = await import('./fixtures/address.ts');
    const { PhoneNumber } = await import('./fixtures/phonenumber.ts');
    const { Person } = await import('./fixtures/person.ts');

    const addr = new Address({ street: '1 Elm St', state: 'CA' });
    const phone = new PhoneNumber({ areaCode: '415', phoneNumber: '5559999' });
    const person = new Person({ name: 'Bob', address: addr, phone });

    expect(Object.isFrozen(person)).toBe(true);
    expect(Object.isFrozen(person.address)).toBe(true);
  });

  it('with() replaces top-level fields', async () => {
    const { Address } = await import('./fixtures/address.ts');
    const { PhoneNumber } = await import('./fixtures/phonenumber.ts');
    const { Person } = await import('./fixtures/person.ts');

    const addr = new Address({ street: '1 Elm St', state: 'CA' });
    const phone = new PhoneNumber({ areaCode: '415', phoneNumber: '5559999' });
    const person = new Person({ name: 'Bob', address: addr, phone });

    const updated = person.with({ name: 'Carol' });
    expect(updated.name).toBe('Carol');
    expect(updated.address).toBe(person.address);
    expect(updated.phone).toBe(person.phone);
    expect(updated).not.toBe(person);
  });

  it('with.address() deep-copies the freezed address', async () => {
    const { Address } = await import('./fixtures/address.ts');
    const { PhoneNumber } = await import('./fixtures/phonenumber.ts');
    const { Person } = await import('./fixtures/person.ts');

    const addr = new Address({ street: '1 Elm St', state: 'CA' });
    const phone = new PhoneNumber({ areaCode: '415', phoneNumber: '5559999' });
    const person = new Person({ name: 'Bob', address: addr, phone });

    const updated = person.with.address({ street: '99 Oak Ave' });
    expect(updated.address.street).toBe('99 Oak Ave');
    expect(updated.address.state).toBe('CA');
    expect(updated.name).toBe('Bob');
    expect(updated.phone).toBe(phone);
    expect(updated).not.toBe(person);
    expect(updated.address).not.toBe(addr);
  });

  it('non-freezed phone has no nested with', async () => {
    const { Address } = await import('./fixtures/address.ts');
    const { PhoneNumber } = await import('./fixtures/phonenumber.ts');
    const { Person } = await import('./fixtures/person.ts');

    const person = new Person({
      name: 'Eve',
      address: new Address({ street: '5 Pine Rd', state: 'TX' }),
      phone: new PhoneNumber({ areaCode: '512', phoneNumber: '5550000' }),
    });

    expect(person.with.address).toBeFunction();
    expect((person.with as any).phone).toBeUndefined();
  });

  it('equals compares freezed address deeply', async () => {
    const { Address } = await import('./fixtures/address.ts');
    const { PhoneNumber } = await import('./fixtures/phonenumber.ts');
    const { Person } = await import('./fixtures/person.ts');

    const phone = new PhoneNumber({ areaCode: '303', phoneNumber: '5551111' });
    const a = new Person({
      name: 'Dan',
      address: new Address({ street: '7 Maple Ln', state: 'CO' }),
      phone,
    });
    const b = new Person({
      name: 'Dan',
      address: new Address({ street: '7 Maple Ln', state: 'CO' }),
      phone,
    });
    expect(a.equals(b)).toBe(true);
  });

  it('equals detects nested address differences', async () => {
    const { Address } = await import('./fixtures/address.ts');
    const { PhoneNumber } = await import('./fixtures/phonenumber.ts');
    const { Person } = await import('./fixtures/person.ts');

    const phone = new PhoneNumber({ areaCode: '303', phoneNumber: '5551111' });
    const a = new Person({
      name: 'Dan',
      address: new Address({ street: '7 Maple Ln', state: 'CO' }),
      phone,
    });
    const b = new Person({
      name: 'Dan',
      address: new Address({ street: '8 Maple Ln', state: 'CO' }),
      phone,
    });
    expect(a.equals(b)).toBe(false);
  });

  it('toString includes all fields', async () => {
    const { Address } = await import('./fixtures/address.ts');
    const { PhoneNumber } = await import('./fixtures/phonenumber.ts');
    const { Person } = await import('./fixtures/person.ts');

    const person = new Person({
      name: 'Fay',
      address: new Address({ street: '10 River Dr', state: 'WA' }),
      phone: new PhoneNumber({ areaCode: '206', phoneNumber: '5552222' }),
    });

    expect(person.toString()).toContain('Person(');
    expect(person.toString()).toContain('name: Fay');
    expect(person.toString()).toContain('Address(');
  });
});
