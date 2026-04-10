import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import { Animal, Cat, Dog } from './animal.ts';
import type { PreferredSize, NumberOfPets } from './animal.ts';
import { $Person } from './person.freezed.ts';

@freezed()
class Person extends $Person {
  constructor(params: { preferredSize: PreferredSize, cat: Cat, dog: Dog }) {
    super(params);
  }

  get pets(): Animal[] {
    return [this.cat, this.dog];
  }

  get numberOfPets(): NumberOfPets {
    return 'Some';
  }
}

export { Person };
