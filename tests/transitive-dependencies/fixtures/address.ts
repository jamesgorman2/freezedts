import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import { $Address } from './address.freezed.ts';

@freezed()
class Address extends $Address {
  constructor(params: { street: string; state: string }) {
    super(params);
  }
}

export { Address };
