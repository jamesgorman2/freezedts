import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import { Node } from './node.ts';
import { $Tree } from './tree.freezed.ts';

export type NodeWith<T> = { kind: 'wrap'; value: T };

@freezed()
export class Tree extends $Tree {
  constructor(params: { root: Node; meta: NodeWith<string> }) {
    super(params);
  }
}
