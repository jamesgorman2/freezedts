import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import { $Registry } from './maps-sets.freezed.ts';

@freezed()
class Registry extends $Registry {
  constructor(params: { lookup: Map<string, number>; tags: Set<string> }) {
    super(params);
  }
}

export { Registry };
