import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import { $Vault } from './non-exported-local.freezed.ts';

type Secret = { token: string };

@freezed()
export class Vault extends $Vault {
  constructor(params: {
    secret: Secret;
    label: string;
  }) {
    super(params);
  }
}
