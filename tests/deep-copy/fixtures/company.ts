import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import { $Assistant, $Director, $Company } from './company.freezed.ts';

@freezed()
class Assistant extends $Assistant {
  constructor(params: { name: string }) {
    super(params);
  }
}

@freezed()
class Director extends $Director {
  constructor(params: { name: string; assistant: Assistant }) {
    super(params);
  }
}

@freezed()
class Company extends $Company {
  constructor(params: { name: string; director: Director }) {
    super(params);
  }
}

export { Assistant, Director, Company };
