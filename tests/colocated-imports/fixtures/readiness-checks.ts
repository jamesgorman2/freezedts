import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import { $ReadinessChecks } from './readiness-checks.freezed.ts';

export type CheckStatus = "ok" | "fail";

export interface StatusContainer {
  s: CheckStatus;
}
export class StatusClass {
  s?: StatusContainer;
}

export type InnerType = any;
export interface InnerInterface {
  x: InnerType;
}
export class InnerClass {
  x?: InnerInterface;
}

@freezed()
export class ReadinessChecks extends $ReadinessChecks {
  constructor(params: {
    db: CheckStatus;
    auth: StatusContainer;
    pubsub: StatusClass;
  }) {
    super(params);
  }
}
