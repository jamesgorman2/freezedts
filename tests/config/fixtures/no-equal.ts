import { freezed } from '../../../src/runtime/freezed.ts';
import { $NoEqual } from './no-equal.freezed.ts';

@freezed({ equal: false })
class NoEqual extends $NoEqual {
  constructor(params: { name: string; age: number }) {
    super(params);
  }
}

export { NoEqual };
