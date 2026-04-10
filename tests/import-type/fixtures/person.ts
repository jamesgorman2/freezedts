import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import type {
  TshirtSize
} from './tshirt-size.ts';
import { PhoneNumber } from './phonenumber.ts';
import { $Person } from './person.freezed.ts';

@freezed()
class Person extends $Person {
  constructor(params: { name: string; tshirtSize: TshirtSize; phone: PhoneNumber }) {
    super(params);
  }
}

export { Person };
