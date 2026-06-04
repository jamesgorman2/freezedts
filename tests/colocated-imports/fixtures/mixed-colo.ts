import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import { $Node2 } from './mixed-colo.freezed.ts';
import type { Coord2 } from './coord2.ts';

export class Plain {
  v: number = 0;
}

@freezed()
export class Node2 extends $Node2 {
  constructor(params: { next: Node2 | null; plain: Plain; pos: Coord2 }) {
    super(params);
  }
}
