import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import type { Wrapper } from './wrapper.ts';
import type { Alpha } from './alpha.ts';
import type { Beta } from './beta.ts';
import { $Complex } from './complex.freezed.ts';

@freezed()
class Complex extends $Complex {
  constructor(params: {
    unionGeneric: Wrapper<Alpha | Beta>;
    nullableGeneric: Wrapper<Alpha | null>;
    arrayGeneric: Wrapper<Alpha[]>;
  }) {
    super(params);
  }
}

export { Complex };
