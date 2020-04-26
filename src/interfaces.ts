import { CreateSecretDTO, GetSecretDTO } from "./secret.dto";

export enum Mode {
  dark="dark",light="light"
}

export interface RequestSchema {
  secrets?: CreateSecretDTO[];
  profile?: Profile;
}

export interface ResponseSchema {
  secrets?: GetSecretDTO[];
  profile?: Profile;
}

export interface Profile {
  mode?: Mode;
}