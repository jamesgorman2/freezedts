import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import { $Inner } from './inner.freezed.ts';

@freezed()
class Inner extends $Inner {
  constructor(params: { value: string }) {
    super(params);
  }
}

export { Inner };
