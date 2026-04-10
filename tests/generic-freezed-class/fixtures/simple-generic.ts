import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import { $SimpleGeneric } from './simple-generic.freezed.ts';

@freezed()
class SimpleGeneric<T> extends $SimpleGeneric<T> {
  constructor(params: { value: T; label: string }) {
    super(params);
  }
}

export { SimpleGeneric };
