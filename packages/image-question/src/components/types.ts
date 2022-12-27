import {
  IAuthoredState as IDrawingToolAuthoredState,
  IInteractiveState as IDrawingToolInteractiveState
} from "drawing-tool/src/components/types";

import {
  IAuthoringImageQuestionMetadata,
  IRuntimeImageQuestionMetadata
} from "@concord-consortium/lara-interactive-api";

export interface IAuthoredStateBase extends IAuthoringImageQuestionMetadata {
  // IRuntimeImageQuestionMetadata adds:
  // - answerType: "image_question"
  // - answerPrompt?: string;
  defaultAnswer?: string;
}
// Final IAuthoredState is combination of properties above and DrawingTool authored state (without questionType).
export type IAuthoredState = IAuthoredStateBase & Omit<IDrawingToolAuthoredState, "questionType">;

export interface IBaseInteractiveState extends IRuntimeImageQuestionMetadata {
  // IRuntimeImageQuestionMetadata adds:
  // - answerType: "image_question_interactive"
  // - answerImageUrl?: string;
  // - answerText?: string;
}
export type IInteractiveState = IBaseInteractiveState & Omit<IDrawingToolInteractiveState, "answerType">;
