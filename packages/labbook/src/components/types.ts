import {
  IInteractiveState as IDrawingToolInteractiveState,
  IAuthoredState as IDrawingToolAuthoredState
} from "drawing-tool-interactive/src/components/types";
import {
  IRuntimeInteractiveMetadata
} from "@concord-consortium/lara-interactive-api";

export interface IAuthoredState extends IDrawingToolAuthoredState {
  // IAuthoringLabbookMetadata adds:
  answerPrompt?: string;
  maxItems: number;
  showItems: number;
  showUploadImageButton: boolean;
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
  version: 1,
  questionType: "iframe_interactive",
  hint: "",
  predictionFeedback: "",
  maxItems: 12,
  showItems: 4,
  showUploadImageButton: false,
  backgroundSource: "upload",
};
