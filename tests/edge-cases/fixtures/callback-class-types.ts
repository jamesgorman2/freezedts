import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import type { Status } from './status.ts';
import type { Config } from './config.ts';
import type { Wrapper } from './wrapper.ts';
import type { Pair } from './pair.ts';
import { $CallbackClassTypes } from './callback-class-types.freezed.ts';

@freezed()
class CallbackClassTypes extends $CallbackClassTypes {
  constructor(params: {
    onStatus: (status: Status) => void;
    fetchStatus: (id: string) => Status;
    transform: (input: Config) => Status;
    processWrapped: (items: Wrapper<Status>) => Pair<string, Status>;
    label: string;
  }) {
    super(params);
  }
}

export { CallbackClassTypes };
