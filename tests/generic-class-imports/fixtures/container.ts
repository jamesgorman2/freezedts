import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import { Wrapper } from './wrapper.ts';
import { Item } from './item.ts';
import { Pair } from './pair.ts';
import { Box } from './box.ts';
import { $Container } from './container.freezed.ts';

@freezed()
class Container extends $Container {
  constructor(params: {
    wrapped: Wrapper<Item>;
    items: Wrapper<Item>[];
    pair: Pair<Item, string>;
    nested: Wrapper<Box<Item>>;
    label: string;
  }) {
    super(params);
  }
}

export { Container };
