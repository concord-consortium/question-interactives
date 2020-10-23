import {
  IAuthoredState as IDrawingToolAuthoredState,
  IInteractiveState as IDrawingToolInteractiveState
} from "../../drawing-tool/components/types";

// Note that TS interfaces should match JSON schema. Currently there's no way to generate one from the other.
// TS interfaces are not available in runtime in contrast to JSON schema.

export interface StampCollection {
  collection: "molecules" | "ngsaObjects" | "custom";
  name?: string;
  stamps?: string[];
}

export interface IAuthoredState extends IDrawingToolAuthoredState {
  version: number;
  questionType: any;
  answerPrompt?: string;
  prompt?: string;
  defaultAnswer?: string;
  imageFit?: string;
  imagePosition?: string;
  required?: boolean;
  predictionFeedback?: string;
  backgroundImageUrl?: string;
  hint?: string;
  customFeedback?: string;
  modalSupported?: boolean;
  stampCollections?: StampCollection[];
}

export interface IInteractiveState extends IDrawingToolInteractiveState {
  answerType: any;
  answerText?: string;
  submitted?: boolean;
}
