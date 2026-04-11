import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import type { Coord } from './coord.ts';
import { $Waypoint } from './with-import-defaults.freezed.ts';

@freezed({
  fields: {
    position: { default: { x: 0, y: 0 } },
  },
})
class Waypoint extends $Waypoint {
  constructor(params: { name: string; position?: Coord }) {
    super(params);
  }
}

export { Waypoint };
