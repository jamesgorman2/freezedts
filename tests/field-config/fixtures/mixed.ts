import { freezed } from '../../../src/runtime/freezed.ts';
import { $Config } from './mixed.freezed.ts';

@freezed({
  fields: {
    port: {
      default: 3000,
      assert: (v: number) => v > 0 && v < 65536,
      message: 'port out of range',
    },
    host: { default: 'localhost' },
  },
})
class Config extends $Config {
  constructor(params: { name: string; host?: string; port?: number }) {
    super(params);
  }
}

export { Config };
