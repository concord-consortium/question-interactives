import { IAuthoringInteractiveMetadata, IRuntimeInteractiveMetadata } from "@concord-consortium/lara-interactive-api";

import { predatorPreyCode } from "../sims/predator-prey-model";

// Note that TS interfaces should match JSON schema. Currently there's no way to generate one from the other.
// TS interfaces are not available in runtime in contrast to JSON schema.

export interface IAuthoredState extends IAuthoringInteractiveMetadata {
  code: string;
  dataSourceInteractive?: string;
  gridHeight: number;
  gridStep: number;
  gridWidth: number;
  hint?: string;
  version: number;
}

export interface IInteractiveState extends IRuntimeInteractiveMetadata {
  version: 1;
  blocklyCode?: string;
  submitted?: boolean;
  recordings: IRecordings;
}

export const DefaultAuthoredState: Omit<Required<IAuthoredState>, "questionSubType"|"required"|"prompt"> = {
  code: "",
  dataSourceInteractive: "",
  gridHeight: 450,
  gridStep: 15,
  gridWidth: 450,
  hint: "",
  questionType: "iframe_interactive",
  version: 1,
};

export const DemoAuthoredState: IAuthoredState = {
  code: predatorPreyCode,
  dataSourceInteractive: "",
  gridHeight: 450,
  gridStep: 15,
  gridWidth: 450,
  hint: "",
  prompt: "",
  questionType: "iframe_interactive",
  version: 1,
};

export interface IRecording {
  objectId?: string;
  startedAt?: number;
  duration?: number;
  thumbnail?: string;
}
export type IRecordings = IRecording[];