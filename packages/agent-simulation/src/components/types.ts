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
  // `version: 2` (literal, not `number`) is what enables `version === 1` to
  // narrow the `IAuthoredStateV1 | IAuthoredState` union down to V1 inside
  // the migration's branch — which is what makes the V1-only
  // `sampleIntervalMs` destructure typecheck. Matches carousel/labbook/
  // scaffolded-question.
  version: 2;
  maxRecordingTime: number;
  sampleIntervalUnit?: "none" | "ms" | "ticks";
  sampleInterval?: number;
  maxSamples?: number;
}

export interface IInteractiveState extends IRuntimeInteractiveMetadata {
  version: 1;
  name?: string;
  blocklyCode?: string;
  simSpeed?: number;
  submitted?: boolean;
  recordings: IRecordings;
}

export const DefaultAuthoredState: Omit<Required<IAuthoredState>,
  "questionSubType"|"required"|"prompt"|"sampleIntervalUnit"|"sampleInterval"|"maxSamples"> = {
  code: "",
  dataSourceInteractive: "",
  gridHeight: 450,
  gridStep: 15,
  gridWidth: 450,
  hint: "",
  questionType: "iframe_interactive",
  version: 2,
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
  version: 2,
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

// Old authored state versions:
export interface IAuthoredStateV1 extends IAuthoringInteractiveMetadata {
  version: 1;
  code: string;
  dataSourceInteractive?: string;
  gridHeight: number;
  gridStep: number;
  gridWidth: number;
  hint?: string;
  maxRecordingTime: number;
  sampleIntervalMs?: number;
  maxSamples?: number;
}
