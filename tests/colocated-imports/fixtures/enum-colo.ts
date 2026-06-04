import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import { $Widget } from './enum-colo.freezed.ts';

export enum Color {
  Red,
  Green,
  Blue,
}

export type Label = string;

@freezed()
export class Widget extends $Widget {
  constructor(params: { color: Color; label: Label }) {
    super(params);
  }
}
