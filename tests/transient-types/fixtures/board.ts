import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import type { Feature } from './external/types.ts';
import { $Board } from './board.freezed.ts';

@freezed()
class Board extends $Board {
  constructor(params: {
    feature: Feature;
    features: Feature[];
  }) {
    super(params);
  }
}

export { Board };
