import { freezed } from '../../../src/runtime/freezed.ts';
import { $ScoreBoard } from './map-set-equality.freezed.ts';

@freezed()
class ScoreBoard extends $ScoreBoard {
  constructor(params: { scores: Map<string, number>; tags: Set<string> }) {
    super(params);
  }
}

export { ScoreBoard };
