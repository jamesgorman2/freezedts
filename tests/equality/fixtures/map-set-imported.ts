import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import type { Coord } from './coord.ts';
import { $Registry } from './map-set-imported.freezed.ts';

@freezed()
class Registry extends $Registry {
  constructor(params: { entries: Map<string, Coord>; coordSet: Set<string> }) {
    super(params);
  }
}

export { Registry };
