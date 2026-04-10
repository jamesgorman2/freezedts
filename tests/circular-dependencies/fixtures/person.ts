import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import { Animal } from './animal.ts';
import { $Person } from './person.freezed.ts';

@freezed()
class Person extends $Person {
  constructor(params: { pet: Animal }) {
    super(params);
  }
}

export { Person };
