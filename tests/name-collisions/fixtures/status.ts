import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import { $Status } from './status.freezed.ts';

@freezed()
export class Status extends $Status {
  constructor(params: { code: number }) {
    super(params);
  }
}
