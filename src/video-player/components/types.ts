import { IAuthoringInteractiveMetadata, IRuntimeInteractiveMetadata } from "@concord-consortium/lara-interactive-api";

// Note that TS interfaces should match JSON schema. Currently there's no way to generate one from the other.
// TS interfaces are not available in runtime in contrast to JSON schema.

export interface IAuthoredState extends IAuthoringInteractiveMetadata {
  version: number;
  questionType: any;
  videoUrl?: string;
  captionUrl?: string;
  poster?: string;
  prompt?: string;
  credit?: string;
  creditLink?: string;
  creditLinkDisplayText?: string;
  fixedAspectRatio?: string;
  fixedHeight?: number;
  required?: boolean;
}

export interface IInteractiveState extends IRuntimeInteractiveMetadata {
  percentageViewed: number;
  lastViewedTimestamp: number;
  submitted?: boolean;
}
