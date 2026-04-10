import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import type { Coord } from './coord.ts';
import type { Tag } from './tag.ts';
import { $WithObjects } from './with-objects.freezed.ts';

@freezed()
class WithObjects extends $WithObjects {
  constructor(params: {
    shallow: { x: number; y: number };
    deep: { outer: { inner: string; count: number } };
    withImported: { position: Coord; label: string };
    withExternal: { tags: Tag[]; active: boolean };
  }) {
    super(params);
  }
}

export { WithObjects };
