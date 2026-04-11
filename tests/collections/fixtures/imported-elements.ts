import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import type { Coord } from './coord.ts';
import { $Path } from './imported-elements.freezed.ts';

@freezed()
class Path extends $Path {
  constructor(params: { name: string; points: Coord[]; lookup: Map<string, Coord> }) {
    super(params);
  }
}

export { Path };
