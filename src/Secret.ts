export class Secret {
  private _name: string;
  private _secret: string;
  private _password: string;

  constructor(name: string, secret: string, password: string) {
    this._name = name;
    this._secret = secret;
    this._password = password;
  }

  get name(): string {
    return this._name;
  }

  set name(value: string) {
    this._name = value;
  }

  get secret(): string {
    return this._secret;
  }

  set secret(value: string) {
    this._secret = value;
  }

  get password(): string {
    return this._password;
  }

  set password(value: string) {
    this._password = value;
  }
}
