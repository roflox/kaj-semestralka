import {CreateSecretDTO, GetSecretDTO} from "./CreateSecretDTO";

export interface QuerySchema {
  secrets: CreateSecretDTO[];
}

export interface GetSchema {
  secrets: GetSecretDTO[];
}
