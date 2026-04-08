import { freezed } from '../../../src/runtime/freezed.ts';
import { $NoToString } from './no-to-string.freezed.ts';

@freezed({ toString: false })
class NoToString extends $NoToString {
  constructor(params: { name: string; age: number }) {
    super(params);
  }
}

export { NoToString };
