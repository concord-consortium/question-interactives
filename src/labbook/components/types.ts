import {
  IInteractiveState as IDrawingToolInteractiveState
} from "../../drawing-tool/components/types";

import {
  IAuthoringInteractiveMetadata,
  IRuntimeInteractiveMetadata
} from "@concord-consortium/lara-interactive-api";

export interface IAuthoredState extends IAuthoringInteractiveMetadata{
  // IAuthoringLabbookMetadata adds:
  answerType: "labbook_interactive";
  answerPrompt?: string;
  version: number;
  maxItems: number;
  showItems: number;
}

export interface ILabbookEntry {
  comment: string;
  data: IDrawingToolInteractiveState;
  id: string;
}

export interface IBaseInteractiveState extends IRuntimeInteractiveMetadata {
  answerType: "interactive_state";
  entries: Array<ILabbookEntry>;
  selectedId: string|null;
}

export type IInteractiveState = IBaseInteractiveState;
