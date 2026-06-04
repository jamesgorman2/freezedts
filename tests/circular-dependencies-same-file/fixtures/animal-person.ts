import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import { $Animal, $Person } from './animal-person.freezed.ts';

@freezed()
class Person extends $Person {
  constructor(params: { name: string; pet: Animal | null }) {
    super(params);
  }
}

@freezed()
class Animal extends $Animal {
  constructor(params: { species: string; owner: Person | null }) {
    super(params);
  }
}

export { Animal };
export { Person };
