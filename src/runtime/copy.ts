import { FREEZED_OPTIONS } from './freezed.js';

export function isFreezedInstance(value: unknown): boolean {
  return (
    value != null &&
    typeof value === 'object' &&
    typeof (value as any).constructor === 'function' &&
    FREEZED_OPTIONS in (value as any).constructor
  );
}

export function createWithProxy<T extends object>(instance: T): any {
  return buildProxy(instance, []);
}

function shallowCopy(instance: any, overrides: Record<string, unknown>): any {
  const Ctor = instance.constructor as new (params: any) => any;
  const props: Record<string, unknown> = {};
  for (const key of Object.keys(instance)) {
    props[key] = instance[key];
  }
  return new Ctor({ ...props, ...overrides });
}

function deepUpdate(root: any, path: string[], overrides: Record<string, unknown>): any {
  if (path.length === 0) return shallowCopy(root, overrides);
  const [head, ...rest] = path;
  return shallowCopy(root, { [head]: deepUpdate(root[head], rest, overrides) });
}

function buildProxy(root: any, path: string[]): any {
  return new Proxy((() => {}) as any, {
    apply(_target, _thisArg, args) {
      return deepUpdate(root, path, args[0] ?? {});
    },
    get(_target, prop) {
      if (typeof prop !== 'string') return undefined;
      let current: any = root;
      for (const p of path) current = current[p];
      const value = current[prop];
      if (!isFreezedInstance(value)) return undefined;
      return buildProxy(root, [...path, prop]);
    },
  });
}
