import {
  IAuthoredState as IDrawingToolAuthoredState,
  IInteractiveState as IDrawingToolInteractiveState
} from "../../drawing-tool/components/types";

import { 
  IAuthoringImageQuestionMetadata,
  IRuntimeMetadataBase
} from "@concord-consortium/lara-interactive-api";

export interface IAuthoredStateBase extends IAuthoringImageQuestionMetadata {
  // IRuntimeImageQuestionMetadata adds:
  // - answerType: "image_question"
  // - answerPrompt?: string;
  maxItems: number;
  showItems: number;
}

// Final IAuthoredState is combination of properties above and DrawingTool authored state (without questionType).
export type IAuthoredState = IAuthoredStateBase & Omit<IDrawingToolAuthoredState, "questionType">;

export interface ILabbookEntry extends IDrawingToolInteractiveState {
  comment: string;
}
export interface IBaseInteractiveState extends IRuntimeMetadataBase {
  answerType: "labbook_question_answer";
  answerImageUrl?: string;
  entries: Array<ILabbookEntry>;
  selectedId: string|null;
}

export type IInteractiveState = IBaseInteractiveState;
