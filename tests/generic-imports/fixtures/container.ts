import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import type { Wrapper } from './wrapper.ts';
import type { Item } from './item.ts';
import type { Pair } from './pair.ts';
import type { Tag } from './tag.ts';
import type { Box } from './box.ts';
import { $Container } from './container.freezed.ts';

@freezed()
class Container extends $Container {
  constructor(params: {
    wrapped: Wrapper<Item>;
    items: Wrapper<Item>[];
    pair: Pair<Item, Tag>;
    nested: Wrapper<Box<Item>>;
    complex: Pair<Box<Item>, Tag>;
    label: string;
  }) {
    super(params);
  }
}

export { Container };
