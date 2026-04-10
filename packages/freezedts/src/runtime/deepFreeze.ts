export function deepFreeze<T>(value: T): T {
  if (value == null || typeof value !== 'object') return value;
  if (Object.isFrozen(value)) return value;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) deepFreeze(value[i]);
    Object.freeze(value);
    return value;
  }
  if (value instanceof Map) {
    const _throw = () => { throw new TypeError('Cannot mutate a frozen Map'); };
    value.set = _throw as any;
    value.delete = _throw as any;
    value.clear = _throw as any;
    value.forEach((v, k) => { deepFreeze(k); deepFreeze(v); });
    Object.freeze(value);
    return value;
  }
  if (value instanceof Set) {
    const _throw = () => { throw new TypeError('Cannot mutate a frozen Set'); };
    value.add = _throw as any;
    value.delete = _throw as any;
    value.clear = _throw as any;
    value.forEach((v) => deepFreeze(v));
    Object.freeze(value);
    return value;
  }
  for (const key of Object.keys(value)) deepFreeze((value as any)[key]);
  Object.freeze(value);
  return value;
}
