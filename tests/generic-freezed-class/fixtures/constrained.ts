import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import type { Identifiable } from './bound.ts';
import { $Constrained } from './constrained.freezed.ts';

@freezed()
class Constrained<T extends Identifiable> extends $Constrained<T> {
  constructor(params: { item: T; count: number }) {
    super(params);
  }
}

export { Constrained };
