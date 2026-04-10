
export const TshirtSize = {
  XS: 'XS',
  S: 'S',
  M: 'M',
  L: 'L',
  XL: 'XL'
} as const

export type TshirtSize = (typeof TshirtSize)[keyof typeof TshirtSize]
