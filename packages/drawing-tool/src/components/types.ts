import { IAuthoringInteractiveMetadata, IRuntimeInteractiveMetadata } from "@concord-consortium/lara-interactive-api";

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
  allowUploadFromMediaLibrary?: boolean;
  hideDrawingTools?: string[];
}

export interface IInteractiveState extends IRuntimeInteractiveMetadata {
  drawingState?: string;
  userBackgroundImageUrl?: string; // snapshot or upload done by student
}

// Note that a few Drawing Tool components are used both by Drawing Tool interactive and Image Question interactive.
// Drawing Tool is a generic interactive ("iframe_interactive"), while Image Question implements special interfaces
// that let it pretend to be an old LARA image question and enable special reporting.
export type IGenericAuthoredState = Omit<IAuthoredState, "questionType"> & { questionType: "image_question" | "iframe_interactive"};
export type IGenericInteractiveState = Omit<IInteractiveState, "answerType"> & { answerType: "image_question_answer" | "interactive_state" };

export const getAnswerType = (questionType: "image_question" | "iframe_interactive") =>
  questionType === "image_question" ? "image_question_answer" : "interactive_state";

export const DemoAuthoredState: IAuthoredState = {
  version: 1,
  questionType: "iframe_interactive",
  hint: "",
  predictionFeedback: "",
};
