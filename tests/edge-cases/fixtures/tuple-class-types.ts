import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import type { Status } from './status.ts';
import type { Wrapper } from './wrapper.ts';
import { $TupleClassTypes } from './tuple-class-types.freezed.ts';

@freezed()
class TupleClassTypes extends $TupleClassTypes {
  constructor(params: {
    statusPair: [Status, string];
    twoClasses: [Status, Wrapper<Status>];
    genericInTuple: [Wrapper<Status>, number];
    mixed: [string, Status, number];
  }) {
    super(params);
  }
}

export { TupleClassTypes };
