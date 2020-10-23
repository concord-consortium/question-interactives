import { IRuntimeInteractiveMetadata, IAuthoringInteractiveMetadata } from "@concord-consortium/lara-interactive-api";

export interface StampCollection {
  collection: "molecules" | "ngsaObjects" | "custom";
  name?: string;
  stamps?: string[];
}

export interface IAuthoredState extends IAuthoringInteractiveMetadata {
  version: number;
  hint?: string;
  prompt?: string;
  required?: boolean;
  predictionFeedback?: string;
  backgroundSource?: "url" | "upload" | "snapshot";
  backgroundImageUrl?: string; // predefined by author
  snapshotTarget?: string;
  imageFit?: string;
  imagePosition?: string;
  stampCollections?: StampCollection[];
}

export interface IInteractiveState extends IRuntimeInteractiveMetadata {
  drawingState?: string;
  userBackgroundImageUrl?: string; // snapshot or upload done by student
}