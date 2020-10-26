import { IAuthoringOpenResponseMetadata, IRuntimeOpenResponseMetadata } from "@concord-consortium/lara-interactive-api";

// Note that TS interfaces should match JSON schema. Currently there's no way to generate one from the other.
// TS interfaces are not available in runtime in contrast to JSON schema.

export interface IAuthoredState extends IAuthoringOpenResponseMetadata {
  version: number;
  defaultAnswer?: string;
  hint?: string;
  predictionFeedback?: string;
  customFeedback?: string;
}

export interface IInteractiveState extends IRuntimeOpenResponseMetadata {}
