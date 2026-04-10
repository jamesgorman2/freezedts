
export const Shade = {
  LIGHT: 'LIGHT',
  MEDIUM: 'MEDIUM',
  DARK: 'DARK',
} as const;

export type Shade = (typeof Shade)[keyof typeof Shade];

export const Finish = {
  MATTE: 'MATTE',
  GLOSSY: 'GLOSSY',
  SATIN: 'SATIN',
} as const;

export type Finish = (typeof Finish)[keyof typeof Finish];
