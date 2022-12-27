import { IAuthoringInteractiveMetadata, IRuntimeInteractiveMetadata } from "@concord-consortium/lara-interactive-api";

// Note that TS interfaces should match JSON schema. Currently there's no way to generate one from the other.
// TS interfaces are not available in runtime in contrast to JSON schema.

export interface IAuthoredState extends IAuthoringInteractiveMetadata {
  version: number;
  defaultAnswer?: string;
  hint?: string;
  scoreBotItemId?: string;
  scoreMapping?: string[];
}

export interface IAttempt {
  score: number;
  answerText: string
}

export interface IInteractiveState extends IRuntimeInteractiveMetadata {
  answerText?: string;
  submitted?: boolean;
  attempts?: IAttempt[];
}
