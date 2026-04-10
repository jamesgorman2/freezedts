import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import { $Address, $Contact } from './multi.freezed.ts';

@freezed()
class Address extends $Address {
  constructor(params: { street: string; city: string; zip?: string }) {
    super(params);
  }
}

@freezed()
class Contact extends $Contact {
  constructor(params: { name: string; email: string }) {
    super(params);
  }
}

export { Address, Contact };
