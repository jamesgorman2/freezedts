import { describe, it, expect } from 'vitest';
import { freezed, getFreezedMetadata } from './freezed.js';

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
    const meta = getFreezedMetadata(Bar);
    expect(meta).toEqual({ equality: 'shallow' });
  });

  it('returns undefined metadata for undecorated classes', () => {
    class Baz {}
    expect(getFreezedMetadata(Baz)).toBeUndefined();
  });

  it('works with no arguments', () => {
    @freezed()
    class Qux {}
    const meta = getFreezedMetadata(Qux);
    expect(meta).toEqual({});
  });
});
