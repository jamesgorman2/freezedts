import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import type { Identifiable } from './bound.ts';
import { $Constrained } from './constrained.freezed.ts';

@freezed()
class Constrained<T extends Identifiable> extends $Constrained<T extends Identifiable> {
  constructor(params: { item: T; count: number }) {
    super(params);
  }
}

export { Constrained };
