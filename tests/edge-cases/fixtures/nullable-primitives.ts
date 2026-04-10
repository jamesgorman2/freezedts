import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import type { Status } from './status.ts';
import { $NullablePrimitives } from './nullable-primitives.freezed.ts';

@freezed()
class NullablePrimitives extends $NullablePrimitives {
  constructor(params: {
    name: string | null;
    count: number | null;
    flag: boolean | null;
    status: Status | null;
  }) {
    super(params);
  }
}

export { NullablePrimitives };
