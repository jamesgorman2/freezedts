import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import type { Status } from './status.ts';
import { $MultiNullable } from './multi-nullable.freezed.ts';

@freezed()
class MultiNullable extends $MultiNullable {
  constructor(params: {
    tripleNull: string | null | undefined;
    importedTriple: Status | null | undefined;
  }) {
    super(params);
  }
}

export { MultiNullable };
