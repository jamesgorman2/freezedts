import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import { $WithTuple } from './tuple.freezed.ts';

@freezed()
class WithTuple extends $WithTuple {
  constructor(params: {
    point: [number, number];
    entry: [string, number];
  }) {
    super(params);
  }
}

export { WithTuple };
