import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import type { Status } from './status.ts';
import type { Taggable } from './taggable.ts';
import { $WithImportedIntersection } from './intersection-imported.freezed.ts';

@freezed()
class WithImportedIntersection extends $WithImportedIntersection {
  constructor(params: {
    item: Status & Taggable;
    label: string;
  }) {
    super(params);
  }
}

export { WithImportedIntersection };
