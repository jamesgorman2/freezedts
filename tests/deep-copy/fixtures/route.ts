import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import { Locatable } from './locatable.ts';
import { $Route } from './route.freezed.ts';

@freezed()
class Route extends $Route {
  constructor(params: { name: string; origin: Locatable }) {
    super(params);
  }
}

export { Route };
