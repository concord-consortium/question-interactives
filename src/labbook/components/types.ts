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

export interface IBaseInteractiveState extends IRuntimeMetadataBase {
  answerType: "image_question_answer";
  answerImageUrl?: string;
  entries: Array<IDrawingToolInteractiveState>;
  selectedIndex: number|null;
}

export type IInteractiveState = IBaseInteractiveState & Omit<IDrawingToolInteractiveState, "answerType">;
