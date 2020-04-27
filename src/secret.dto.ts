export class CreateSecretDTO {
  public name: string;
  public secret: string;
  public password: string;
  public id: number;

  constructor(name: string, secret: string, password: string) {
    this.name = name;
    this.secret = secret;
    this.password = password;
  }
}

export class GetSecretDTO {
  public id: number;
  public name: string;
  public secret: string;

  constructor(id:number,name: string, secret: string) {
    this.id = id;
    this.name = name;
    this.secret = secret;
  }
}