import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import { $Widget } from './widget.freezed.ts';

export type Status = 'on' | 'off';

@freezed()
export class Widget extends $Widget {
  constructor(params: { status: Status }) {
    super(params);
  }
}
