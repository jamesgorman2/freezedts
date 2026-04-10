export const PreferredSize = {
  XS: 'XS',
  S: 'S',
  M: 'M',
  L: 'L',
  XL: 'XL'
} as const

export type PreferredSize = (typeof PreferredSize)[keyof typeof PreferredSize]

export const NumberOfPets = {
  None: 'None',
  Some: 'Some',
  Lots: 'Lots',
} as const

export type NumberOfPets = (typeof NumberOfPets)[keyof typeof NumberOfPets]

class Animal { }

class Cat extends Animal { }

class Dog extends Animal { }

export { Animal, Cat, Dog };
