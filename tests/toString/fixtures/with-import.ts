import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import type { Coord } from './coord.ts';
import { $Waypoint } from './with-import.freezed.ts';

@freezed()
class Waypoint extends $Waypoint {
  constructor(params: { name: string; position: Coord }) {
    super(params);
  }
}

export { Waypoint };
