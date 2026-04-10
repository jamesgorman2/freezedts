import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import { Address } from './address.ts';
import { PhoneNumber } from './phonenumber.ts';
import { $Person } from './person.freezed.ts';

@freezed()
class Person extends $Person {
  constructor(params: { name: string; address: Address; phone: PhoneNumber }) {
    super(params);
  }
}

export { Person };
