import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import type { Coord } from './coord.ts';
import { $Locatable } from './cross-module.freezed.ts';

@freezed()
class Locatable extends $Locatable {
  constructor(params: { name: string; position: Coord }) {
    super(params);
  }
}

export { Locatable };
