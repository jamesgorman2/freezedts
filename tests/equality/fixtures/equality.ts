import { freezed } from '../../../src/runtime/freezed.ts';
import { $DeepPerson, $ShallowPerson } from './equality.freezed.ts';

@freezed()
class DeepPerson extends $DeepPerson {
  constructor(params: { name: string; metadata: Record<string, string> }) {
    super(params);
  }
}

@freezed({ equality: 'shallow' })
class ShallowPerson extends $ShallowPerson {
  constructor(params: { name: string; metadata: Record<string, string> }) {
    super(params);
  }
}

export { DeepPerson, ShallowPerson };
