import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import { $WithBigInt } from './bigint-prop.freezed.ts';

@freezed()
class WithBigInt extends $WithBigInt {
  constructor(params: {
    id: bigint;
    label: string;
  }) {
    super(params);
  }
}

export { WithBigInt };
