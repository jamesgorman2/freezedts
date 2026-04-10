import { describe, it, expect } from 'bun:test';
import { freezed, getFreezedOptions } from './freezed.js';

describe('freezed decorator', () => {
  it('is a valid class decorator that returns the class unchanged', () => {
    @freezed()
    class Foo {
      value = 1;
    }
    const instance = new Foo();
    expect(instance).toBeInstanceOf(Foo);
    expect(instance.value).toBe(1);
  });

  it('stores options in metadata registry', () => {
    @freezed({ equality: 'shallow' })
    class Bar {
      value = 2;
    }
    const meta = getFreezedOptions(Bar);
    expect(meta).toEqual({ equality: 'shallow' });
  });

  it('returns undefined metadata for undecorated classes', () => {
    class Baz {}
    expect(getFreezedOptions(Baz)).toBeUndefined();
  });

  it('works with no arguments', () => {
    @freezed()
    class Qux {}
    const meta = getFreezedOptions(Qux);
    expect(meta).toEqual({});
  });

  it('stores options as Symbol property on the class', () => {
    @freezed({ equality: 'deep' })
    class Sym {}
    const options = (Sym as any)[Symbol.for('freezedts:options')];
    expect(options).toEqual({ equality: 'deep' });
  });
});
