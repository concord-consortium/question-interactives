import { IAuthoringOpenResponseMetadata, IRuntimeOpenResponseMetadata } from "@concord-consortium/lara-interactive-api";

// Note that TS interfaces should match JSON schema. Currently there's no way to generate one from the other.
// TS interfaces are not available in runtime in contrast to JSON schema.

export interface IAuthoredState extends IAuthoringOpenResponseMetadata {
  version: number;
  defaultAnswer?: string;
  hint?: string;
  predictionFeedback?: string;
  audioEnabled?: boolean;
  voiceTypingEnabled?: boolean;
}

export interface IInteractiveState extends IRuntimeOpenResponseMetadata {
  answerText?: string;
  audioFile?: string;
  submitted?: boolean;
}

export const DemoAuthoredState: IAuthoredState = {
  version: 1,
  questionType: "open_response",
  defaultAnswer: "",
  hint: "",
  predictionFeedback: "",
  audioEnabled: false,
  voiceTypingEnabled: false
};
