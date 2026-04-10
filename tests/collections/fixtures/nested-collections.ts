import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import { $Matrix } from './nested-collections.freezed.ts';

@freezed()
class Matrix extends $Matrix {
  constructor(params: { grid: number[][]; metadata: { label: string; values: number[] } }) {
    super(params);
  }
}

export { Matrix };
