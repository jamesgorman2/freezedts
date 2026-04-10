import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import { $Person } from './same-file.freezed.ts';

interface PersonParams {
  name: string;
  age: number;
}

@freezed()
class Person extends $Person {
  constructor(params: PersonParams) {
    super(params);
  }
}

export { Person };
