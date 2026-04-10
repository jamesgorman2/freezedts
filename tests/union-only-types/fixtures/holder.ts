import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import type { Alpha } from './alpha.ts';
import type { Beta } from './beta.ts';
import { $Holder } from './holder.freezed.ts';

@freezed()
class Holder extends $Holder {
  constructor(params: {
    ab: Alpha | Beta;
  }) {
    super(params);
  }
}

export { Holder };
