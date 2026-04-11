import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import { $GenericWithDefaults } from './generic-with-defaults.freezed.ts';

@freezed({
  fields: {
    count: { default: 0 },
  },
})
class GenericWithDefaults<T> extends $GenericWithDefaults<T> {
  constructor(params: { value: T; count?: number }) {
    super(params);
  }
}

export { GenericWithDefaults };
