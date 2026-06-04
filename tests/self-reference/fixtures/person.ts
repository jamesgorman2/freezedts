import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import { $Person } from './person.freezed.ts';

@freezed()
class Person extends $Person {
  constructor(params: { name: string; child: Person | null }) {
    super(params);
  }
}

export { Person };
