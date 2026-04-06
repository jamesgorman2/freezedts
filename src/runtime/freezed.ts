export interface FieldConfig {
  default?: unknown;
  assert?: (value: any) => boolean;
  message?: string;
}

export interface FreezedOptions {
  equality?: 'deep' | 'shallow';
  copyWith?: boolean;
  equal?: boolean;
  fields?: Record<string, FieldConfig>;
}

export const FREEZED_OPTIONS = Symbol.for('freezedts:options');

export function freezed(options?: FreezedOptions) {
  return function <T extends abstract new (...args: any[]) => any>(
    target: T,
    _context: ClassDecoratorContext,
  ): T {
    (target as any)[FREEZED_OPTIONS] = options ?? {};
    return target;
  };
}

export function getFreezedOptions(target: Function): FreezedOptions | undefined {
  return (target as any)[FREEZED_OPTIONS];
}
