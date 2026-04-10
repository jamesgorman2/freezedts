import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import { $NoToString } from './no-to-string.freezed.ts';

@freezed({ toString: false })
class NoToString extends $NoToString {
  constructor(params: { name: string; age: number }) {
    super(params);
  }
}

export { NoToString };
