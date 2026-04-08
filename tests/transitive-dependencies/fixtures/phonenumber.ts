class PhoneNumber {
  readonly areaCode: string;
  readonly phoneNumber: string;

  constructor(params: { areaCode: string; phoneNumber: string }) {
    this.areaCode = params.areaCode;
    this.phoneNumber = params.phoneNumber;
  }
}

export { PhoneNumber };
