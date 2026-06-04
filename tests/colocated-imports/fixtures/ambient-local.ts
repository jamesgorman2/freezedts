import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import { $Box } from './ambient-local.freezed.ts';

declare type Ambient = { v: number };

@freezed()
export class Box extends $Box {
  constructor(params: {
    item: Ambient;
    label: string;
  }) {
    super(params);
  }
}
