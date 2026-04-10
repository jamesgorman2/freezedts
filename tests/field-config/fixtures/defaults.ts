import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import { $Counter, $Simple } from './defaults.freezed.ts';

@freezed({
  fields: {
    count: { default: 0 },
    label: { default: 'untitled' },
  },
})
class Counter extends $Counter {
  constructor(params: { name: string; count?: number; label?: string }) {
    super(params);
  }
}

@freezed()
class Simple extends $Simple {
  constructor(params: { value: string }) {
    super(params);
  }
}

export { Counter, Simple };
