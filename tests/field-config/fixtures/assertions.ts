import { freezed } from '../../../src/runtime/freezed.ts';
import { $Email } from './assertions.freezed.ts';

@freezed({
  fields: {
    address: {
      assert: (v: string) => v.includes('@'),
      message: 'invalid email address',
    },
    subject: { assert: (v: string) => v.length > 0 },
  },
})
class Email extends $Email {
  constructor(params: { address: string; subject: string; body: string }) {
    super(params);
  }
}

export { Email };
