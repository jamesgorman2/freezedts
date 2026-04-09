// src/runtime/index.ts
export { freezed, getFreezedOptions, FREEZED_OPTIONS } from './freezed.js';
export type { FreezedOptions, FieldConfig } from './freezed.js';
export { isFreezedInstance, createWithProxy } from './copy.js';
export { deepEqual } from './deepEqual.js';
export { deepFreeze } from './deepFreeze.js';
