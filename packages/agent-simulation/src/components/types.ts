import { IAuthoringInteractiveMetadata, IRuntimeInteractiveMetadata } from "@concord-consortium/lara-interactive-api";

import { predatorPreyCode } from "../sims/predator-prey-model";

export const defaultMaxRecordingTime = 90; // 90 seconds
export const maxMaxRecordingTime = 300; // 5 minutes

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
  maxRecordingTime: number;
}

export interface IInteractiveState extends IRuntimeInteractiveMetadata {
  version: 1;
  name?: string;
  blocklyCode?: string;
  simSpeed?: number;
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
  maxRecordingTime: defaultMaxRecordingTime,
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
  maxRecordingTime: defaultMaxRecordingTime,
};

export interface IRecording {
  modelName: string;
  objectId?: string;
  startedAt?: number;
  duration?: number;
  thumbnail?: string;
  snapshot?: string;
  globalValues?: Record<string, any>;
}
export type IRecordings = IRecording[];