import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import { Person } from './person.ts';
import { $Animal } from './animal.freezed.ts';

@freezed()
class Animal extends $Animal {
  constructor(params: { owner: Person }) {
    super(params);
  }
}

export { Animal };
