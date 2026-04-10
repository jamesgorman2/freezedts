import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import { $NoCopy } from './no-copy-with.freezed.ts';

@freezed({ copyWith: false })
class NoCopy extends $NoCopy {
  constructor(params: { name: string; age: number }) {
    super(params);
  }
}

export { NoCopy };
