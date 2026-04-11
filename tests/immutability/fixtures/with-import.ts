import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import type { Coord } from './coord.ts';
import { $Locatable } from './with-import.freezed.ts';

@freezed()
class Locatable extends $Locatable {
  constructor(params: { label: string; position: Coord }) {
    super(params);
  }
}

export { Locatable };
