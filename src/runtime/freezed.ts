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

const metadataRegistry = new WeakMap<Function, FreezedOptions>();

export function freezed(options?: FreezedOptions) {
  return function <T extends abstract new (...args: any[]) => any>(
    target: T,
    _context: ClassDecoratorContext,
  ): T {
    metadataRegistry.set(target, options ?? {});
    return target;
  };
}

export function getFreezedMetadata(target: Function): FreezedOptions | undefined {
  return metadataRegistry.get(target);
}
