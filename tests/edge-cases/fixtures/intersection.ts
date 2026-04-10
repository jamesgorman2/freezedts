import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import { $WithIntersection } from './intersection.freezed.ts';

interface Named {
  name: string;
}

interface Aged {
  age: number;
}

@freezed()
class WithIntersection extends $WithIntersection {
  constructor(params: {
    person: Named & Aged;
    label: string;
  }) {
    super(params);
  }
}

export { WithIntersection };
