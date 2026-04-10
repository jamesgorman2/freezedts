import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import type { Status } from './status.ts';
import { $WithUtilityTypes } from './utility-types.freezed.ts';

@freezed()
class WithUtilityTypes extends $WithUtilityTypes {
  constructor(params: {
    partial: Partial<Status>;
    picked: Pick<Status, 'code'>;
    record: Record<string, number>;
  }) {
    super(params);
  }
}

export { WithUtilityTypes };
