import { freezed } from '../../../src/runtime/freezed.ts';
import { $Measurement } from './nan-equality.freezed.ts';

@freezed()
class Measurement extends $Measurement {
  constructor(params: { label: string; value: number }) {
    super(params);
  }
}

export { Measurement };
