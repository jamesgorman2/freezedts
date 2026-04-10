class Pigment {
  readonly name: string;
  readonly opacity: number;

  constructor(params: { name: string; opacity: number }) {
    this.name = params.name;
    this.opacity = params.opacity;
  }
}

export { Pigment };
