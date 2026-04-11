import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import type { Identifiable } from './bound.ts';
import { $WithComplexGenerics } from './with-complex-generics.freezed.ts';

@freezed()
class WithComplexGenerics<T extends Identifiable, Items extends T[]> extends $WithComplexGenerics<T, Items> {
  constructor(params: { items: Items; primary: T; label: string }) {
    super(params);
  }
}

export { WithComplexGenerics };
