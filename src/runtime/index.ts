// src/runtime/index.ts
export { freezed, getFreezedOptions, FREEZED_OPTIONS } from './freezed.js';
export type { FreezedOptions, FieldConfig } from './freezed.js';
export { isFreezedInstance, createWithProxy } from './copy.js';
