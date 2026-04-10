import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import type { Alpha } from './alpha.ts';
import { $Loose } from './loose.freezed.ts';

@freezed()
class Loose extends $Loose {
  constructor(params: {
    maybe: string | undefined;
    anything: any;
    unionUndef: Alpha | undefined;
  }) {
    super(params);
  }
}

export { Loose };
