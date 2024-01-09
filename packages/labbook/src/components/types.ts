import {
  IInteractiveState as IDrawingToolInteractiveState,
  IAuthoredState as IDrawingToolAuthoredState
} from "drawing-tool-interactive/src/components/types";
import {
  IRuntimeInteractiveMetadata
} from "@concord-consortium/lara-interactive-api";

export interface IAuthoredState extends IDrawingToolAuthoredState {
  version: 2;
  // IAuthoringLabbookMetadata adds:
  answerPrompt?: string;
  maxItems: number;
  showItems: number;
  showUploadImageButton: boolean;
  // hideAnnotationTool: boolean; <-- removed in version 2
}

export interface IAuthoredStateV1 extends IDrawingToolAuthoredState {
  version: 1;
  // IAuthoringLabbookMetadata adds:
  answerPrompt?: string;
  maxItems: number;
  showItems: number;
  showUploadImageButton: boolean;
  hideAnnotationTool: boolean;
}

export interface ILabbookEntry {
  comment: string;
  imageUrl?: string|null;
  data?: IDrawingToolInteractiveState;
  dataHash?: string|null;
  id: string;
}

export interface IBaseInteractiveState extends IRuntimeInteractiveMetadata {
  answerType: "interactive_state";
  entries: Array<ILabbookEntry>;
  selectedId: string;
}

export type IInteractiveState = IBaseInteractiveState;

export const DemoAuthoredState: IAuthoredState = {
  version: 2,
  questionType: "iframe_interactive",
  hint: "",
  predictionFeedback: "",
  maxItems: 12,
  showItems: 4,
  showUploadImageButton: false,
  backgroundSource: "upload",
};
