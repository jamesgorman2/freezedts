import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import { Inner } from './inner.ts';
import { $Outer } from './outer.freezed.ts';

@freezed()
class Outer extends $Outer {
  constructor(params: { name: string; inner: Inner }) {
    super(params);
  }
}

export { Outer };
