import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import type { Coord } from './coord.ts';
import { $Marker } from './no-copy-with-imported.freezed.ts';

@freezed({ copyWith: false })
class Marker extends $Marker {
  constructor(params: { label: string; position: Coord }) {
    super(params);
  }
}

export { Marker };
