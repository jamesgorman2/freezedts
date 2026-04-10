import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import type { Alpha } from './alpha.ts';
import type { Beta } from './beta.ts';
import { $Collection } from './collection.freezed.ts';

@freezed()
class Collection extends $Collection {
  constructor(params: {
    items: (Alpha | Beta)[];
    nullables: (Alpha | null)[];
  }) {
    super(params);
  }
}

export { Collection };
