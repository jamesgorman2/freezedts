import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import { Person } from './person.ts';
import { $Animal } from './animal.freezed.ts';

@freezed()
class Animal extends $Animal {
  constructor(params: { species: string; owner: Person | null }) {
    super(params);
  }
}

export { Animal };
