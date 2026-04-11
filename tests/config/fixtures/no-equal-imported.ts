import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import type { Coord } from './coord.ts';
import { $Pin } from './no-equal-imported.freezed.ts';

@freezed({ equal: false })
class Pin extends $Pin {
  constructor(params: { label: string; position: Coord }) {
    super(params);
  }
}

export { Pin };
