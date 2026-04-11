import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import type { Coord } from './coord.ts';
import { $Marker } from './with-complex-fields.freezed.ts';

interface MarkerParams {
  label: string;
  position: Coord;
}

@freezed()
class Marker extends $Marker {
  constructor(params: MarkerParams) {
    super(params);
  }
}

export { Marker };
