export class CreateSecretDTO {
  public name: string;
  public secret: string;
  public password: string;

  constructor(name: string, secret: string, password: string) {
    this.name = name;
    this.secret = secret;
    this.password = password;
  }
}

export class GetSecretDTO {
  public name: string;
  public secret: string;

  constructor(name: string, secret: string, password: string) {
    this.name = name;
    this.secret = secret;
  }
}