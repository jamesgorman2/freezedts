import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import { $PropertyAccessor } from './property-accessor.freezed.ts';

@freezed()
class PropertyAccessor<Type, Key extends keyof Type> extends $PropertyAccessor<Type, Key extends keyof Type> {
  constructor(params: { source: Type; key: Key }) {
    super(params);
  }
}

export { PropertyAccessor };
