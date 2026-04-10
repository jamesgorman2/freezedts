import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import { $Address, $Employee } from './nested.freezed.ts';

@freezed()
class Address extends $Address {
  constructor(params: { street: string; city: string }) {
    super(params);
  }
}

@freezed()
class Employee extends $Employee {
  constructor(params: { name: string; address: Address }) {
    super(params);
  }
}

export { Address, Employee };
