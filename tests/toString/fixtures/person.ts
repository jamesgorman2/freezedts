import { freezed } from '../../../src/runtime/freezed.ts';
import { $Person } from './person.freezed.ts';

@freezed()
class Person extends $Person {
  constructor(params: { firstName: string; lastName: string; age: number }) {
    super(params);
  }
}

export { Person };
