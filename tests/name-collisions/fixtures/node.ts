import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import { $Node } from './node.freezed.ts';

@freezed()
export class Node extends $Node {
  constructor(params: { x: number }) {
    super(params);
  }
}
