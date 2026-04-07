import { freezed } from '../../../src/runtime/freezed.ts';
import { $Tag, $Item } from './nullable-freezed.freezed.ts';

@freezed()
class Tag extends $Tag {
  constructor(params: { label: string }) {
    super(params);
  }
}

@freezed({ equality: 'shallow' })
class Item extends $Item {
  constructor(params: { name: string; tag?: Tag }) {
    super(params);
  }
}

export { Tag, Item };
