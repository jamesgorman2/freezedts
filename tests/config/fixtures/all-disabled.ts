import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import { $Minimal } from './all-disabled.freezed.ts';

@freezed({ copyWith: false, equal: false, toString: false })
class Minimal extends $Minimal {
  constructor(params: { name: string; value: number }) {
    super(params);
  }
}

export { Minimal };
