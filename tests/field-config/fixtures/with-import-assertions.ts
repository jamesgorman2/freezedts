import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import type { Coord } from './coord.ts';
import { $Marker } from './with-import-assertions.freezed.ts';

@freezed({
  fields: {
    position: {
      assert: (v: Coord) => v.x >= 0 && v.y >= 0,
      message: 'position must be non-negative',
    },
  },
})
class Marker extends $Marker {
  constructor(params: { name: string; position: Coord }) {
    super(params);
  }
}

export { Marker };
