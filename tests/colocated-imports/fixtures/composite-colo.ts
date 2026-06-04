import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import { $Doc } from './composite-colo.freezed.ts';

export type Tag = string;

export interface Meta {
  x: number;
}

@freezed()
export class Doc extends $Doc {
  constructor(params: { tags: Tag[]; meta: Meta | null }) {
    super(params);
  }
}
