export class Wrapper<T> {
  constructor(
    public readonly value: T,
    public readonly label: string,
  ) {}
}
