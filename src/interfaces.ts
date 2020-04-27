import { CreateSecretDTO, GetSecretDTO } from "./secret.dto";

export enum Mode {
  dark="dark",light="light"
}

export interface RequestSchema {
  secrets?: CreateSecretDTO[];
}

export interface ResponseSchema {
  secrets?: GetSecretDTO[];
}