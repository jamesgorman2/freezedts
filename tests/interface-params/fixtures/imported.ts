import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import { AddressFields } from './types.ts';
import { $Address } from './imported.freezed.ts';

@freezed()
class Address extends $Address {
  constructor(params: AddressFields) {
    super(params);
  }
}

export { Address };
