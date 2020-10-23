import {
  IAuthoringMultipleChoiceChoiceMetadata, IAuthoringMultipleChoiceMetadata, IRuntimeMultipleChoiceMetadata,
} from "@concord-consortium/lara-interactive-api";

// Note that TS interfaces should match JSON schema. Currently there's no way to generate one from the other.
// TS interfaces are not available in runtime in contrast to JSON schema.

export interface IChoice extends IAuthoringMultipleChoiceChoiceMetadata {
  choiceFeedback?: string;
}

export type ILayout = "vertical" | "horizontal" | "likert" | "dropdown";

export interface IAuthoredState extends IAuthoringMultipleChoiceMetadata {
  version: number;
  questionType: any;
  hint?: string;
  multipleAnswers?: boolean;
  layout?: ILayout;
  enableCheckAnswer?: boolean;
  customFeedback?: boolean;
  choices: IChoice[];
}

export interface IInteractiveState extends IRuntimeMultipleChoiceMetadata {}
