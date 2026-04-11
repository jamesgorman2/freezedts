import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import type { Coord } from './coord.ts';
import { $Place } from './place.freezed.ts';

@freezed()
class Place extends $Place {
  constructor(params: { name: string; location: Coord }) {
    super(params);
  }
}

export { Place };
