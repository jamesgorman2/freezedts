import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import { $WithCallback } from './function-prop.freezed.ts';

@freezed()
class WithCallback extends $WithCallback {
  constructor(params: {
    handler: (value: string) => void;
    predicate: (x: number) => boolean;
    label: string;
  }) {
    super(params);
  }
}

export { WithCallback };
