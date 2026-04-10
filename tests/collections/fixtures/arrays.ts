import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import { $Team } from './arrays.freezed.ts';

@freezed()
class Team extends $Team {
  constructor(params: { name: string; members: string[]; scores: number[] }) {
    super(params);
  }
}

export { Team };
